import ftplib
import telnetlib3
import asyncio
from typing import cast
from io import BytesIO
from app.core.config import settings
from app.models import NetworkIED
from app.exceptions import IEDTimeoutError, IEDAuthError, IEDConnectionError

# FUNÇÃO DE BUSCA DE IEDS NA REDE
# REDUNDÂNCIA DE BUSCA - ARQUIVO / DUMP
async def search_ied(ied: NetworkIED) -> tuple[str, str]:
    USER = settings.IED_USER
    PASSWORD = settings.IED_PASSWORD
    # TENTA CONEXÃO
    def _ftp_sync() -> tuple[str, str]:
        ftp = ftplib.FTP()
        try:
            ftp.connect(ied.ip_address, 21, timeout=5)
            if ftp.sock:
                ftp.sock.settimeout(30)
            ftp.login(user=USER, passwd=PASSWORD)

            paths_options = ["/settings/SET_1.txt", "/SET_1.txt", "SET_1.txt"]

            for path in paths_options:
                try:
                    buffer = BytesIO()
                    ftp.retrbinary(f"RETR {path}", buffer.write)
                    output = buffer.getvalue().decode("latin-1", errors="ignore").strip()
                    if output:
                        return output, "SET_1.txt"
                except ftplib.error_perm as e:
                    continue

            raise Exception("Arquivo SET_1 não encontrado no FTP")
        
        except ftplib.error_reply as e:
            raise IEDAuthError(f"Erro de Login/Senha no FTP: {str(e)}")
        except OSError as e:
            raise IEDConnectionError(f"Falha de Conexão FTP: {str(e)}")
        finally:
            try:
                ftp.quit()
            except Exception:
                ftp.close()

    # TENTATIVA VIA FTP
    async def try_ftp() -> tuple[str, str]:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, _ftp_sync)

    # TENTATIVA VIA TELNET (DUMP DE DADOS)
    async def try_telnet():
        try:
            reader, writer = await asyncio.wait_for(
                telnetlib3.open_connection(ied.ip_address, 23), timeout=5
            )
        except asyncio.TimeoutError:
            raise IEDTimeoutError("Timeout ao conectar via Telnet.")
        except ConnectionRefusedError:
            raise IEDConnectionError("Conexão recusada.")
        except Exception as e:
            raise Exception(f"Erro de conexão Telnet: {str(e)}")
        
        writer = cast(telnetlib3.TelnetWriter, writer)  
        
        # ENVIA COMANDO DE BUSCA DE DADOS DAS CONFIGURAÇÕES
        try:
            writer.write("\r\n")

            await asyncio.wait_for(reader.readuntil(b""), timeout=10)
            writer.write(USER + "\r\n")

            await asyncio.wait_for(reader.readuntil(b"Password ? "), timeout=10)
            writer.write(PASSWORD + "\r\n")

            try:
                raw_login_response = await asyncio.wait_for(reader.readuntil(b"=>"), timeout=15)
            except asyncio.IncompleteReadError as e:
                raw_login_response = e.partial

            cmd_response_str = (
                raw_login_response if isinstance(raw_login_response, str)
                else bytes(raw_login_response).decode("latin-1", errors="ignore")
            )

            if any(x in cmd_response_str.lower() for x in ["incorrect", "invalid", "denied", "failed", "erro"]):
                raise IEDAuthError()

            writer.write("SHO 1\r\n")
            
            try:
                raw_output = await asyncio.wait_for(reader.readuntil(b"=>"), timeout=30)
            except asyncio.TimeoutError:
                raw_output = await reader.read(200000)

            output: str = (
                raw_output if isinstance(raw_output, str)
                else bytes(raw_output).decode("latin-1", errors="ignore")
            )

            return output.strip(), "SET_1_DUMP.txt"
        
        except (IEDTimeoutError, IEDAuthError, IEDConnectionError):
            raise
        except asyncio.TimeoutError:
            raise IEDTimeoutError("Timeout durante coleta de dados.")
        except Exception as e:
            raise IEDConnectionError(f"Erro inesperado no Telnet: {str(e)}")
        finally:
            writer.close()


    if ied.connection_type == "FTP":
        protocols = [("FTP", try_ftp), ("TELNET", try_telnet)]
    else:
        protocols = [("TELNET", try_telnet), ("FTP", try_ftp)]

    last_errors = []

    for name, func in protocols:
        try:
            print(f"Iniciando busca via {name} em {ied.ip_address}")
            result = await func()
            if result:
                return result
        except Exception as e:
            last_errors.append(e)
            continue
    
    if any(isinstance(e, IEDAuthError) for e in last_errors):
        raise IEDAuthError("Credenciais incorretas. Verifique usuário e senha do IED.")

    if any(isinstance(e, IEDTimeoutError) for e in last_errors):
        raise IEDTimeoutError(f"IED em {ied.ip_address} não respondeu a tempo.")

    if any(isinstance(e, IEDConnectionError) for e in last_errors):
        raise IEDConnectionError(f"Não foi possível conectar ao IED em {ied.ip_address}.")

    raise IEDConnectionError(f"Falha ao comunicar com {ied.ip_address}.")

    
import ftplib
import telnetlib3
import asyncio
from typing import cast
from io import BytesIO
from app.core.config import settings
from app.models import NetworkIED
from app.exceptions import IEDTimeoutError, IEDAuthError, IEDConnectionError

# FTP - 21
# TELNET - 23

# FUNÇÃO DE BUSCA DE IEDS NA REDE
# REDUNDÂNCIA DE BUSCA - ARQUIVO / DUMP
async def search_ied(ied: NetworkIED) -> tuple[str, str]:
    USER = settings.IED_USER
    PASSWORD = settings.IED_PASSWORD
    # TENTA CONEXÃO
    def _ftp_sync() -> tuple[str, str]:
        print(f"Iniciando FTP conexão com {ied.ip_address}:21")
        ftp = ftplib.FTP()
        try:
            ftp.connect(ied.ip_address, 21, timeout=30)
            print(f"Autenticando como '{USER}'")
            if ftp.sock:
                ftp.sock.settimeout(30)
            ftp.login(user=USER, passwd=PASSWORD)
            print(f"Autenticado com sucesso")

            paths_options = ["/settings/SET_1.txt", "/SET_1.txt", "SET_1.txt"]

            for path in paths_options:
                print(f"Tentando caminho: {path}")
                try:
                    buffer = BytesIO()
                    ftp.retrbinary(f"RETR {path}", buffer.write)
                    output = buffer.getvalue().decode("latin-1", errors="ignore").strip()
                    if output:
                        print(f"Sucesso via FTP no caminho {path}")
                        return output, "SET_1.txt"
                except ftplib.error_perm as e:
                    print(f"Caminho {path} negado: {e}")
                    continue

            raise Exception("Arquivo SET_1 não encontrado no FTP")
        
        except ftplib.error_reply as e:
            raise IEDAuthError(f"Erro de Login/Senha no FTP: {str(e)}")
        except OSError as e:
            raise IEDConnectionError(f"Falha de Conexão FTP: {str(e)}")
        finally:
            try:
                ftp.quit()
                print(f"Conexão FTP encerrada")
            except Exception:
                ftp.close()

    # TENTATIVA VIA FTP
    async def try_ftp() -> tuple[str, str]:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, _ftp_sync)

    # TENTATIVA VIA TELNET (DUMP DE DADOS)
    async def try_telnet():
        print(f"Iniciando conexão com {ied.ip_address}:23")
        try:
            reader, writer = await asyncio.wait_for(
                telnetlib3.open_connection(ied.ip_address, 23), timeout=20
            )
        except asyncio.TimeoutError:
            raise IEDTimeoutError("Timeout ao conectar via Telnet.")
        except ConnectionRefusedError:
            raise IEDConnectionError("Conexão recusada.")
        except Exception as e:
            raise Exception(f"Erro de conexão Telnet: {str(e)}")
        
        writer = cast(telnetlib3.TelnetWriter, writer)  
        print(f"Conexão estabelecida")
        
        # ENVIA COMANDO DE BUSCA DE DADOS DAS CONIGURAÇÕES
        try:
            writer.write("\r\n")

            print(f"Aguardando prompt de login...")
            await asyncio.wait_for(reader.readuntil(b":"), timeout=10)
            writer.write(USER + "\r\n")
            print(f"Usuário enviado")

            print(f"Aguardando prompt de senha...")
            await asyncio.wait_for(reader.readuntil(b":"), timeout=10)
            writer.write(PASSWORD + "\r\n")
            print(f"Senha enviada")

            print(f"Aguardando resposta do IED após login...")
            cmd_response = await asyncio.wait_for(reader.read(1024), timeout=10)
            cmd_response_str = (
                cmd_response
                if isinstance(cmd_response, str)
                else bytes(cmd_response).decode("latin-1", errors="ignore")
            )
            print(f"Resposta pós-login: {repr(cmd_response_str)}")

            if any(x in cmd_response_str.lower() for x in ["incorrect", "invalid", "denied", "failed", "erro"]):
                raise IEDAuthError()

            if "=>" not in cmd_response_str:
                print(f"Aguardando prompt '=>'...")
                await asyncio.wait_for(reader.readuntil(b"=>"), timeout=10)
                
            writer.write("SHO 1\r\n")
            print(f"Comando 'SHO 1' enviado")
            
            print(f"Aguardando resposta do IED...")
            try:
                raw_output = await asyncio.wait_for(reader.readuntil(b"=>"), timeout=20)
            except asyncio.TimeoutError:
                print(f"Erro de Timeout na leitura")
                raw_output = await reader.read(200000)

            output: str = (
                raw_output
                if isinstance(raw_output, str)
                else bytes(raw_output).decode("latin-1", errors="ignore")
            )
            print(f"Resposta recebida — {len(output)} caracteres")

            if not output.strip():
                raise Exception("IED não retornou dados via Telnet.")
            
            return output.strip(), "SET_1_DUMP.txt"
        
        except (IEDTimeoutError, IEDAuthError, IEDConnectionError):
            raise
        except asyncio.TimeoutError:
            raise IEDTimeoutError("Timeout durante coleta de dados.")
        except Exception as e:
            raise IEDConnectionError(f"Erro inesperado no Telnet: {str(e)}")
        finally:
            writer.close()
            print(f"Conexão Telnet encerrada")

    ftp_error: Exception | None = None
    telnet_error: Exception | None = None

    if ied.connection_type == "FTP":
        try:
            return await try_ftp()
        except Exception as e:
            ftp_error = e
            print(f"FTP falhou ({ied.ip_address}), tentando Fallback Telnet: {e}")
            try:
                return await try_telnet()
            except Exception as e2:
                telnet_error = e2
    else:
        try:
            return await try_telnet()
        except Exception as e:
            telnet_error = e
            print(f"Telnet falhou ({ied.ip_address}), tentando Fallback FTP: {e}")
            try:
                return await try_ftp()
            except Exception as e2:
                ftp_error = e2
    
    print(f"[ERRO TÉCNICO] Detalhes da Falha em {ied.ip_address}:")
    print(f"  - FTP: {ftp_error}")
    print(f"  - Telnet: {telnet_error}")

    all_errors = [ftp_error, telnet_error]
    
    if any(isinstance(e, IEDAuthError) for e in all_errors):
        raise IEDAuthError("Credenciais incorretas. Verifique usuário e senha do IED.")

    if any(isinstance(e, IEDTimeoutError) for e in all_errors):
        raise IEDTimeoutError(f"IED em {ied.ip_address} não respondeu a tempo.")

    if any(isinstance(e, IEDConnectionError) for e in all_errors):
        raise IEDConnectionError(f"Não foi possível conectar ao IED em {ied.ip_address}.")

    raise IEDConnectionError(f"Falha ao comunicar com {ied.ip_address}.")

    
import ftplib
import telnetlib3
import asyncio
from typing import cast
from io import BytesIO
from app.core.config import settings
from app.models import NetworkIED

# FTP - 21
# TELNET - 23

# FUNÇÃO DE BUSCA DE IEDS NA REDE
# REDUNDÂNCIA DE BUSCA - ARQUIVO / DUMP
async def search_ied(ied: NetworkIED) -> tuple[str, str]:
    USER = settings.IED_USER
    PASSWORD = settings.IED_PASSWORD
    # TENTA CONEXÃO
    def _ftp_sync() -> tuple[str, str]:
        ftp = ftplib.FTP()
        try:
            ftp.connect(ied.ip_address, 21, timeout=30)
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
                        print(f"STATUS: Sucesso via FTP no caminho {path}")
                        return output, "SET_1.txt"
                except ftplib.error_perm:
                    continue

            raise Exception("Arquivo SET_1 não encontrado no FTP")
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
        reader, writer = await asyncio.wait_for(
            telnetlib3.open_connection(ied.ip_address, 23), timeout=15
        )
        writer = cast(telnetlib3.TelnetWriter, writer)  
        
        # ENVIA COMANDO DE BUSCA DE DADOS DAS CONIGURAÇÕES
        try:
            await asyncio.wait_for(reader.readuntil(b"login:"), timeout=10)
            writer.write(USER + "\r")

            await asyncio.wait_for(reader.readuntil(b"password:"), timeout=10)
            writer.write(PASSWORD + "\r")

            await asyncio.wait_for(reader.readuntil(b">"), timeout=10)
            writer.write("TAR\r")
            
            try:
                raw_output = await asyncio.wait_for(reader.read(100000), timeout=20)
            except asyncio.TimeoutError:
                raw_output = b""

            output = raw_output if isinstance(raw_output, str) else bytes(raw_output).decode("latin-1", errors="ignore")

            if not output.strip():
                raise Exception("IED não retornou dados via Telnet")
            
            return output.strip(), "SET_1_DUMP.txt"
        finally:
            writer.close()

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
    
    raise Exception(
        f"Falha em ambos os protocolos para {ied.ip_address} — "
        f"FTP: {ftp_error} | Telnet: {telnet_error}"
    )
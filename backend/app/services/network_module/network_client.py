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
async def search_ied(ied: NetworkIED, password: str) -> tuple[str, str]:
    # TENTA CONEXÃO
    async def try_ftp():
        ftp = ftplib.FTP()
        ftp.connect(ied.ip_address, 21, timeout=10)
        ftp.login(user=settings.IED_USER, passwd=password)

        paths_options = ["/settings/SET_1.txt", "/SET_1.txt"]

        # TENTATIVA VIA FTP (ARQUIVO SET_1)
        for path in paths_options:
            try:
                buffer = BytesIO()
                ftp.retrbinary(f"RETR {path}", buffer.write)
                output = buffer.getvalue().decode("ascii", errors="ignore").strip()
                if output:
                    ftp.quit()
                    print(f"STATUS: Sucesso via FTP no caminho {path}")
                    return output, "SET_1.txt"
            except ftplib.error_perm:
                continue
        
        ftp.quit()
        raise Exception("Arquivo não encontrado no FTP")

    # TENTATIVA VIA TELNET (DUMP DE DADOS)
    async def try_telnet():
        reader, writer = await telnetlib3.open_connection(ied.ip_address, 23) 
        writer = cast(telnetlib3.TelnetWriter, writer)   
        
        # ENVIA COMANDO DE BUSCA DE DADOS DAS CONIGURAÇÕES
        await asyncio.wait_for(reader.readuntil(b"login:"), timeout=5)
        writer.write((settings.IED_USER + "\r").encode("ascii"))
        await asyncio.wait_for(reader.readuntil(b"password:"), timeout=5)
        writer.write((password + "\r").encode("ascii"))

        await asyncio.wait_for(reader.readuntil(b">"), timeout=5)
        writer.write(b"TAR\r")
        
        try:
            raw_output = await asyncio.wait_for(reader.read(65536), timeout=10)
        except asyncio.TimeoutError:
            raw_output = b""

        output = raw_output if isinstance(raw_output, str) else bytes(raw_output).decode("ascii", errors="ignore")

        writer.close()

        if not output.strip():
             raise Exception("IED não retornou dados via Telnet")
        return output.strip(), "SET_1_DUMP.txt"

    if ied.connection_type == "FTP":
        try:
            return await try_ftp()
        except Exception as e:
            print(f"FTP falhou, tentando Fallback Telnet: {e}")
            return await try_telnet()
    else:
        try:
            return await try_telnet()
        except Exception as e:
            print(f"Telnet falhou, tentando Fallback FTP: {e}")
            return await try_ftp()
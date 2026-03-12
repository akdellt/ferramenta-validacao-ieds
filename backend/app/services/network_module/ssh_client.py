import paramiko 
from app.core.config import settings
from app.models import NetworkIED

# FUNÇÃO DE BUSCA DE IEDS NA REDE
# REDUNDÂNCIA DE BUSCA - ARQUIVO / DUMP
def search_ied(ied: NetworkIED) -> tuple[str, str]:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    # TENTA CONEXÃO
    try:
        client.connect(
            hostname=ied.ip_address,
            port=ied.port,
            username=settings.IED_SSH_USER,
            password=settings.IED_SSH_PASSWORD,
            timeout=15,
            look_for_keys=False,
            allow_agent=False,
        )

        # TENTATIVA VIA SFTP (ARQUIVO SET_1)
        try:
            sftp = client.open_sftp()
            remote_path = "/settings/SET_1.txt"

            with sftp.open(remote_path, "r") as f:
                output = f.read().decode("ascii", errors="ignore").strip()
            
            sftp.close()
            print(f"STATUS: Arquivo {remote_path} resgatado via SFTP")
            return output, "SET_1.txt"

        # TENTATIVA VIA SSH (DUMP DE DADOS)
        except Exception as sftp_error:
            print(f"SFTP falhou ({sftp_error}). Tentando método SSH")

            # ENVIA COMANDO DE BUSCA DE DADOS DAS CONIGURAÇÕES
            _, stdout, stderr = client.exec_command("TAR")
            output = stdout.read().decode("ascii", errors="ignore").strip()
            error = stderr.read().decode("ascii", errors="ignore").strip()
            print(f"Resposta recebida ({len(output)} bytes)")

            if error:
                raise Exception(f"Erro retornado pelo IED {ied.name}: {error}")
            
            if not output:
                raise Exception("IED não retornou dados nem via SFTP nem via SSH")
                
            return output, "SET_1_DUMP.txt"

    except paramiko.AuthenticationException:
        raise Exception(f"Falha de autenticação no IED {ied.name} ({ied.ip_address})")

    except paramiko.SSHException as e:
        raise Exception(f"Erro SSH ao conectar em {ied.name} ({ied.ip_address}): {str(e)}")

    except TimeoutError:
        raise Exception(f"Timeout ao conectar em {ied.name} ({ied.ip_address})")

    finally:
        client.close()
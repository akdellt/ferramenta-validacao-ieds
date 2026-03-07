import os
import paramiko
import socket
import threading
import textwrap
from paramiko.common import AUTH_SUCCESSFUL, AUTH_FAILED, OPEN_SUCCEEDED, OPEN_FAILED_ADMINISTRATIVELY_PROHIBITED
from paramiko import SFTPServerInterface, SFTPServer, SFTPAttributes, SFTPHandle
from paramiko.sftp import SFTP_NO_SUCH_FILE

BASE_PATH = os.path.dirname(os.path.abspath(__file__))
FILE_PATH_REAL = os.path.join(BASE_PATH, "settings", "set_1.txt")

USER_TEST = os.getenv("IED_SSH_USER", "ACC")
PASS_TEST = os.getenv("IED_SSH_PASSWORD", "OTTER")

IED_RESPONSE = textwrap.dedent("""
    [INFO] RELAYTYPE=2414 FID=SEL-2414-RXXX-V0-Z012010-DXXXXXXXX BFID=BOOTLDR-R501-V0-Z000000-D20140224 PARTNO=241421A1A9X743A1840
    DID,"XXXX #NOME ALIM" TID,"EQTL-XX SE XXX" CTR,"250" CTRN,"250" CTRX,"250" CTRX_W1,"250" CTRX_W2,"250" CTRX_W3,"250"
    PTR,"120.00" EDEM,"THM" DMTC,"5" AI301NAM,"AI301" AI301TYP,"I" AI301L,"4.000" AI301H,"20.000" AI301EU,"mA" AI301EL,"4.000"
    AI301EH,"20.000" AI301LW1,"OFF" AI301LW2,"OFF" AI301LAL,"OFF" AI301HW1,"OFF" AI301HW2,"OFF" AI301HAL,"OFF"
    AI302NAM,"AI302" AI302TYP,"I" AI302L,"4.000" AI302H,"20.000" AI302EU,"mA" AI302EL,"4.000" AI302EH,"20.000"
    AI302LW1,"OFF" AI302LW2,"OFF" AI302LAL,"OFF" AI302HW1,"OFF" AI302HW2,"OFF" AI302HAL,"OFF"
    AI303NAM,"AI303" AI303TYP,"I" AI303L,"4.000" AI303H,"20.000" AI303EU,"mA" AI303EL,"4.000" AI303EH,"20.000"
    AI303LW1,"OFF" AI303LW2,"OFF" AI303LAL,"OFF" AI303HW1,"OFF" AI303HW2,"OFF" AI303HAL,"OFF"
    AI304NAM,"AI304" AI304TYP,"I" AI304L,"4.000" AI304H,"20.000" AI304EU,"mA" AI304EL,"4.000" AI304EH,"20.000"
    AI304LW1,"OFF" AI304LW2,"OFF" AI304LAL,"OFF" AI304HW1,"OFF" AI304HW2,"OFF" AI304HAL,"OFF"

""").strip() 

class FakeFileHandle(SFTPHandle):
    def __init__(self, path, flags):
        super().__init__(flags)
        self.readfile = open(path, "rb")

    def close(self):
        super().close()
        self.readfile.close()

    def read(self, offset, length):
        self.readfile.seek(offset)
        return self.readfile.read(length)

    def stat(self):
        return SFTPAttributes.from_stat(os.fstat(self.readfile.fileno()))

# INTERFACE SFTP
class IEDSFTPServer(SFTPServerInterface):
    def stat(self, path):
        if "SET_1.txt" in path and os.path.exists(FILE_PATH_REAL):
            return SFTPAttributes.from_stat(os.stat(FILE_PATH_REAL))
        return SFTP_NO_SUCH_FILE

    def list_dir(self, path):
        if (path == "/settings" or path == "settings") and os.path.exists(FILE_PATH_REAL):
            return [SFTPAttributes.from_stat(os.stat(FILE_PATH_REAL), "SET_1.txt")]
        return []

    def open(self, path, flags, attr):
        if "SET_1.txt" in path and os.path.exists(FILE_PATH_REAL):
            return FakeFileHandle(FILE_PATH_REAL, flags)
        return SFTP_NO_SUCH_FILE

# INTERFACE SSH
class FakeIEDServer(paramiko.ServerInterface):
    def check_auth_password(self, username, password):
        if username == USER_TEST and password == PASS_TEST:
            return AUTH_SUCCESSFUL
        return AUTH_FAILED

    def check_channel_request(self, kind, chanid):
        if kind == "session": return OPEN_SUCCEEDED
        return OPEN_FAILED_ADMINISTRATIVELY_PROHIBITED

    def check_channel_exec_request(self, channel, command):
        text_command = command.decode("ascii").strip().upper()
        
        def reponse():
            import time
            time.sleep(0.5)
            if text_command == "TAR":
                print(f"Enviando resposta simulada")
                channel.send(IED_RESPONSE.encode("ascii") + b"\r\n")
                channel.send_exit_status(0)
            channel.close()

        threading.Thread(target=reponse, daemon=True).start()
        return True

# GERENCIADOR DE CONEXÃO
def handle_client(client_socket):
    transport = paramiko.Transport(client_socket)
    host_key = paramiko.RSAKey.generate(2048)
    transport.add_server_key(host_key)

    transport.set_subsystem_handler('sftp', SFTPServer, IEDSFTPServer)

    server = FakeIEDServer()
    try:
        transport.start_server(server=server)
        channel = transport.accept(20)
        if channel:
            print("Cliente conectado e canais prontos.")
            transport.join()
    except Exception as e:
        print(f"Erro: {e}")
    finally:
        transport.close()

def start_server(host="0.0.0.0", port=2222):
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_socket.bind((host, port))
    server_socket.listen(5)
    print(f"Servidor IED Híbrido (SFTP/SSH) em {host}:{port}")
    try:
        while True:
            client_sock, _ = server_socket.accept()
            threading.Thread(target=handle_client, args=(client_sock,), daemon=True).start()
    except KeyboardInterrupt:
        print("\nParando servidor...")

if __name__ == "__main__":
    start_server()
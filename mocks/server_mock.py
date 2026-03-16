import os
import threading
import socket
from pyftpdlib.authorizers import DummyAuthorizer
from pyftpdlib.handlers import FTPHandler
from pyftpdlib.servers import FTPServer

USER_TEST = os.getenv("IED_USER", "2AC")
PASS_TEST = os.getenv("IED_PASSWORD", "OTTER")
IED_RESPONSE = """
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
"""

# CONFIGURAÇÃO FTP (Porta 21)
def start_ftp():
    authorizer = DummyAuthorizer()
    if not os.path.exists("./settings"): os.makedirs("./settings")
    with open("./settings/SET_1.txt", "w") as f: f.write(IED_RESPONSE)

    authorizer.add_user(USER_TEST, PASS_TEST, ".", perm="elradfmwMT")
    
    handler = FTPHandler
    handler.authorizer = authorizer
    handler.banner = "SEL-2414 FTP Server Ready."
    
    server = FTPServer(("0.0.0.0", 21), handler)
    print(" [FTP] Servidor rodando na porta 21...")
    server.serve_forever()

# CONFIGURAÇÃO TELNET (Porta 23)
def handle_telnet_client(conn, addr):
    try:
        conn.sendall(b"login: ")
        user = conn.recv(1024).decode().strip()
        conn.sendall(b"password: ")
        password = conn.recv(1024).decode().strip()

        if user == USER_TEST and password == PASS_TEST:
            conn.sendall(b"\r\nConnected to SEL-2414\r\n>")
            while True:
                data = conn.recv(1024).decode().strip().upper()
                if not data: break
                if data == "TAR":
                    conn.sendall(IED_RESPONSE.encode("ascii") + b"\r\n>")
                elif data == "EXIT":
                    break
                else:
                    conn.sendall(b"\r\nCommand not found\r\n>")
        else:
            conn.sendall(b"\r\nLogin Incorrect\r\n")
    finally:
        conn.close()

def start_telnet():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(("0.0.0.0", 23))
    server.listen(5)
    print(" [Telnet] Servidor rodando na porta 23...")
    while True:
        conn, addr = server.accept()
        threading.Thread(target=handle_telnet_client, args=(conn, addr)).start()

if __name__ == "__main__":
    threading.Thread(target=start_ftp, daemon=True).start()
    start_telnet()
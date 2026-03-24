import os
import threading
import socket
import time
from pyftpdlib.authorizers import DummyAuthorizer
from pyftpdlib.handlers import FTPHandler
from pyftpdlib.servers import FTPServer

USER_TEST = os.getenv("IED_USER", "ACC")
PASS_TEST = os.getenv("IED_PASSWORD", "OTTER")
IED_RESPONSE = """[INFO]
RELAYTYPE=SEL-311C-1
FID=SEL-311C-1-RXXX-V0-Z104101-DXXXXXXXX
BFID=SLBT-3CF1-R102-V0-Z100100-DXXXXXXXX
PARTNO=0311C11HM4K5442
[1]
RID,"XXXX"
TID,"EQTL-XX SE XXX"
CTR,"120"
CTRN,"120"
PTR,"600.00"
PTRS,"600.00"
VNOM,"66.40"
Z1MAG,"7.80"
Z1ANG,"84.00"
Z0MAG,"24.80"
Z0ANG,"81.50"
Z0SMAG,"0.36"
Z0SANG,"84.61"
LL,"100.00"
EADVS,"N"
E21P,"N"
E21MG,"N"
E21XG,"3"
E50P,"1"
E50G,"1"
E50Q,"N"
E51P,"Y"
E51G,"Y"
E51Q,"N"
E50BF,"N"
E32,"AUTO"
EOOS,"N"
ELOAD,"N"
ESOTF,"N"
EVOLT,"N"
E25,"N"
EFLOC,"Y"
EBBPT,"N"
ECOMM,"N"
E81,"N"
E79,"N"
EZ1EXT,"N"
EZ1EXTP,"N"
EZ1EXTG,"N"
ECCVT,"N"
ESV,"16"
EDEM,"ROL"
KGN,"OFF"
INMTA,"0.00"
Z0MTA,"72.47"
27B81P,"40.00"
59QW,"1.67"
DMTC,"15"
PDEMP,"OFF"
NDEMP,"OFF"
GDEMP,"OFF"
QDEMP,"OFF"
TDURD,"9.00"
TDUR1D,"9.00"
TDUR3D,"9.00"
CFD,"60.00"
3POD,"0.50"
OPO,"52"
27PO,"40.00"
50LP,"0.25"
TOPD,"2.00"
TULO,"3"
Z2GTSP,"N"
67QGSP,"N"
SV1DO,"60.00"
SV1PU,"0.00"
SV10DO,"60.00"
SV10PU,"0.00"
SV11DO,"0.00"
SV11PU,"300.00"
SV12DO,"12.00"
SV12PU,"12.00"
SV13DO,"0.00"
SV13PU,"1800.00"
SV14DO,"30.00"
SV14PU,"6.00"
SV15DO,"30.00"
SV15PU,"7.25"
SV16DO,"30.00"
SV16PU,"8.50"
SV2DO,"60.00"
SV2PU,"0.00"
SV3DO,"1.75"
SV3PU,"300.00"
SV4DO,"1800.00"
SV4PU,"0.00"
SV5DO,"0.00"
SV5PU,"0.00"
SV6DO,"0.00"
SV6PU,"0.00"
SV7DO,"0.00"
SV7PU,"0.00"
SV8DO,"30.00"
SV8PU,"9.00"
SV9DO,"0.00"
SV9PU,"21.00"
25ANG1,"25"
25ANG2,"40"
25RCF,"1.00"
25SF,"0.042"
25VHI,"75.00"
"""

# CONFIGURAÇÃO FTP (Porta 21)
def start_ftp():
    authorizer = DummyAuthorizer()
    base_dir = os.path.dirname(os.path.abspath(__file__))
    settings_path = os.path.join(base_dir, "settings")
    
    if not os.path.exists(settings_path):
        os.makedirs(settings_path)

    authorizer.add_user(USER_TEST, PASS_TEST, base_dir, perm="elradfmwMT")
    
    handler = FTPHandler
    handler.authorizer = authorizer
    handler.banner = "FTP Server Ready."
    
    server = FTPServer(("0.0.0.0", 21), handler)
    print(" [FTP] Servidor rodando na porta 21...")
    server.serve_forever()

# CONFIGURAÇÃO TELNET (Porta 23)
def handle_telnet_client(conn, addr):
    try:
        conn.sendall(b"login: ")
        user = conn.recv(1024).decode().strip()
        conn.sendall(b"\r\npassword: ")
        password = conn.recv(1024).decode().strip()

        if user == USER_TEST and password == PASS_TEST:
            conn.sendall(b"\r\n=>")
            while True:
                data = conn.recv(1024).decode().strip().upper()
                if not data: break
                if data == "SHO 1":
                    conn.sendall(b"\r\n" + IED_RESPONSE.encode("latin-1") + b"\r\n=>")
                elif data in ["EXIT", "QUIT"]:
                    break
                else:
                    conn.sendall(b"\r\nCommand not found\r\n>")
        else:
            print(f" [MOCK] Falha de login para o usuário: {user}")
            conn.sendall(b"\r\nLogin Incorrect\r\n")
            time.sleep(1.5)
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
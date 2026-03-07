import os

os.environ["IED_SSH_USER"] = "ACC"
os.environ["IED_SSH_PASSWORD"] = "OTTER"

from backend.app.models import NetworkIED
from backend.app.services.network_module.ssh_client import search_ied

ied_fake = NetworkIED()
ied_fake.id = 1
ied_fake.name = "SEL-2414-TESTE"
ied_fake.relay_model = "SEL 2414"
ied_fake.ip_address = "127.0.0.1"
ied_fake.port = 2222

result = search_ied(ied_fake)
print(result)
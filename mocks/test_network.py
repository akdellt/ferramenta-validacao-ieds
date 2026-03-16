import os

os.environ["IED_USER"] = "2AC"
os.environ["IED_PASSWORD"] = "OTTER"

from backend.app.models import NetworkIED
from backend.app.services.network_module.network_client import search_ied

ied_fake = NetworkIED()
ied_fake.id = 1
ied_fake.name = "CPL_2414"
ied_fake.relay_model = "SEL 2414"
ied_fake.ip_address = "127.0.0.1"
ied_fake.port = 21

result = search_ied(ied_fake, "OTTER")
print(result)
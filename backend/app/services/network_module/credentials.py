import asyncio
import httpx
from app.core.config import settings


async def _get_vault_token() -> str:
    """Autentica no Vault e retorna o token de acesso."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.VAULT_API_URL}{settings.VAULT_AUTH_ENDPOINT}",
            json={
                "client_id": settings.VAULT_CLIENT_ID,
                "client_secret": settings.VAULT_CLIENT_SECRET,
            },
            timeout=10
        )
        response.raise_for_status()
        return response.json()["access_token"]
    
async def get_dynamic_password(ied_name: str) -> str:
    # OPÇÃO 1: OAuth2
    is_mock_url = "vault-empresa.com" in settings.VAULT_API_URL or not settings.VAULT_API_URL
    if not is_mock_url:
        try:
            token = await _get_vault_token()
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{settings.VAULT_API_URL}{settings.VAULT_SECRET_ENDPOINT}/{ied_name}",
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=10
                )
                response.raise_for_status()
                return response.json()[settings.VAULT_SECRET_KEY]
        except httpx.HTTPError as e:
            pass

    # OPÇÃO 2: Cálculo local
    
    await asyncio.sleep(0.1)
    return settings.IED_PASSWORD

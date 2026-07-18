from fastapi import HTTPException, status


class IntegrationNotConfigured(RuntimeError):
    def __init__(self, key_name: str, purpose: str):
        self.key_name = key_name
        self.purpose = purpose
        super().__init__(f"{key_name} is required for {purpose}.")


def configuration_error(exc: IntegrationNotConfigured) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail={
            "status": "not_connected",
            "missing": exc.key_name,
            "why": exc.purpose,
        },
    )

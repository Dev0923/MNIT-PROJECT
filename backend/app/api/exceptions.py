from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.core.exceptions import (
    AppError,
    ResourceNotFound,
    PermissionDenied,
    InvalidStateTransition,
    DuplicateResource,
    QRValidationException
)
from app.core.security import AuthenticationError
from app.services.auth_service import AccountLockedException

def register_exception_handlers(app: FastAPI):
    """Registers global exception handlers to map AppErrors to clean JSON responses."""
    
    def create_error_response(status_code: int, exc: AppError):
        return JSONResponse(
            status_code=status_code,
            content={
                "error": exc.code,
                "message": exc.message,
                "details": exc.details
            }
        )

    @app.exception_handler(ResourceNotFound)
    async def resource_not_found_handler(request: Request, exc: ResourceNotFound):
        return create_error_response(404, exc)

    @app.exception_handler(PermissionDenied)
    async def permission_denied_handler(request: Request, exc: PermissionDenied):
        return create_error_response(403, exc)

    @app.exception_handler(AuthenticationError)
    async def authentication_error_handler(request: Request, exc: AuthenticationError):
        return create_error_response(401, exc)
        
    @app.exception_handler(AccountLockedException)
    async def account_locked_handler(request: Request, exc: AccountLockedException):
        return create_error_response(403, exc)

    @app.exception_handler(InvalidStateTransition)
    async def invalid_state_transition_handler(request: Request, exc: InvalidStateTransition):
        return create_error_response(400, exc)

    @app.exception_handler(DuplicateResource)
    async def duplicate_resource_handler(request: Request, exc: DuplicateResource):
        return create_error_response(409, exc)

    @app.exception_handler(QRValidationException)
    async def qr_validation_exception_handler(request: Request, exc: QRValidationException):
        return create_error_response(400, exc)

    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError):
        # Fallback for base AppErrors
        return create_error_response(500, exc)

from typing import Any, Optional

class AppError(Exception):
    """Base class for all application-specific exceptions."""
    def __init__(self, message: str, code: str = "INTERNAL_ERROR", details: Optional[Any] = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.details = details

class ResourceNotFound(AppError):
    def __init__(self, message: str = "Resource not found", details: Optional[Any] = None):
        super().__init__(message, code="NOT_FOUND", details=details)

class PermissionDenied(AppError):
    def __init__(self, message: str = "Permission denied", details: Optional[Any] = None):
        super().__init__(message, code="FORBIDDEN", details=details)

class InvalidStateTransition(AppError):
    def __init__(self, message: str = "Invalid state transition", details: Optional[Any] = None):
        super().__init__(message, code="INVALID_STATE_TRANSITION", details=details)

class DuplicateResource(AppError):
    def __init__(self, message: str = "Resource already exists", details: Optional[Any] = None):
        super().__init__(message, code="DUPLICATE_RESOURCE", details=details)

class QRValidationException(AppError):
    def __init__(self, message: str = "Invalid or malformed QR token", details: Optional[Any] = None):
        super().__init__(message, code="INVALID_QR_TOKEN", details=details)

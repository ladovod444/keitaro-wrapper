"""Доменные ошибки интеграции с Keitaro.

status_code — тот HTTP-код, который отдаём НАШЕМУ клиенту,
а не тот, что пришёл от Keitaro.
"""


class KeitaroError(Exception):
    status_code = 502  # по умолчанию — проблема на стороне upstream

    def __init__(self, message: str, *, details=None, upstream_status: int | None = None):
        super().__init__(message)
        self.message = message
        self.details = details
        self.upstream_status = upstream_status


class KeitaroValidationError(KeitaroError):
    """Keitaro отверг payload (400/422) — виноват запрос."""
    status_code = 422


class KeitaroNotFound(KeitaroError):
    status_code = 404


class KeitaroAuthError(KeitaroError):
    """401/403 от Keitaro = неверный API-ключ НА СЕРВЕРЕ.

    Важно: это не 401 для нашего клиента — его credentials тут не при чём,
    иначе фронтенд начнёт показывать «перелогиньтесь».
    """
    status_code = 502


class KeitaroUnavailable(KeitaroError):
    """Сеть/таймаут/5xx — Keitaro недоступен."""
    status_code = 504
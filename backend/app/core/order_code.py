"""주문 코드 생성 유틸리티 (HG-XXXX 형식)."""
import random
import string


_ALPHABET = string.ascii_uppercase + string.digits  # 36자 (I/O/0 포함, MVP 단순화)


def generate_order_code() -> str:
    """HG-XXXX 형식 주문 코드 생성. 라우터에서 IntegrityError 시 최대 3회 재시도."""
    suffix = "".join(random.choices(_ALPHABET, k=4))
    return f"HG-{suffix}"

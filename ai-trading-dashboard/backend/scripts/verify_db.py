"""One-off verification: list public tables after migrate."""
import asyncio
from prisma import Prisma


async def main() -> None:
    db = Prisma()
    await db.connect()
    rows = await db.query_raw(
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema = 'public' AND table_type = 'BASE TABLE' "
        "ORDER BY table_name"
    )
    print("tables:", [r["table_name"] for r in rows])
    await db.disconnect()


if __name__ == "__main__":
    asyncio.run(main())

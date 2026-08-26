# Weather Station
Better than looking out your window.

## The Stack

Frontend UI: Astro

Middle/Bridge: FastAPI & Redis

Backend: Python & PostGres

### The Middle layer

Live data from the sensors is published to a local Redis server in memory. This is received by FastAPI, which publishes the data out over a SSE connection.

### Port numbers
- Astro: 80
- FastAPI: 8000
- Redis: 6379

## How to run

### Installation

You will need:

- Redis (Python & local)
- PostGres
- All Python packages in `requirements.txt`

If running in prod: don't forget to change `data_collector.py` to use the module `weatherhat` instead of `weatherhat_simulator`.
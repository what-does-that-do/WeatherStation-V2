import logging, os
from datetime import datetime

LOGS_DIR = "/var/log/weatherstation/"

class Logger:
    def __init__(self, process: str):
        if not os.path.exists(LOGS_DIR):
            os.mkdir(LOGS_DIR)
        
        filename = os.path.join(LOGS_DIR, datetime.now().strftime("%Y-%m-%d")+".log")

        self.logger = logging.getLogger(__name__)
        self.logger.setLevel("DEBUG")

        file_handler = logging.FileHandler(
                        filename,
                        mode="a",
                        encoding="utf-8",
                    )
        
        file_handler.setFormatter(
            logging.Formatter(
                "[{asctime}] ["+process+"] [{levelname}] {message}",
                style="{"
            )
        )
        
        self.logger.addHandler(file_handler)

    def debug(self, message: str):
        self.logger.debug(message)
    def info(self, message: str):
        self.logger.info(message)
    def warning(self, message: str):
        self.logger.warning(message)
    def error(self, message: str):
        self.logger.error(message)
    def critical(self, message: str):
        self.logger.critical(message)
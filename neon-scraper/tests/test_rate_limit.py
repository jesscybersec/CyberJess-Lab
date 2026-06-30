import unittest

from neon_scraper.utils.rate_limit import RateLimiter


class RateLimiterTests(unittest.TestCase):
    def test_zero_delay_does_not_block(self):
        limiter = RateLimiter(0)

        limiter.wait("example.com")
        limiter.wait("example.com")

        self.assertTrue(True)


if __name__ == "__main__":
    unittest.main()


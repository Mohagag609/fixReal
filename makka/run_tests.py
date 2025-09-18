#!/usr/bin/env python
"""
Test runner script for the Makka real estate management system.
"""

import os
import sys
import django
from django.conf import settings
from django.test.utils import get_runner

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "makka.settings")
    django.setup()
    
    TestRunner = get_runner(settings)
    test_runner = TestRunner()
    
    # Run all tests
    failures = test_runner.run_tests([
        "realpp.tests.test_models",
        "realpp.tests.test_forms", 
        "realpp.tests.test_views",
        "realpp.tests.test_calculations",
        "realpp.tests.test_services"
    ])
    
    if failures:
        sys.exit(1)
    else:
        print("\n✅ All tests passed successfully!")
        sys.exit(0)
# OpenAI Monitoring: Monitor OpenAI API Usage with Grafana Cloud
[![Grafana](https://img.shields.io/badge/grafana-%23F46800.svg?&logo=grafana&logoColor=white)](https://grafana.com)
[![GitHub Last Commit](https://img.shields.io/github/last-commit/grafana/grafana-openai-monitoring)](https://github.com/grafana/grafana-openai-monitoring/tags)
[![GitHub Contributors](https://img.shields.io/github/contributors/grafana/grafana-openai-monitoring)](https://github.com/grafana/grafana-openai-monitoring/tags)

[![Python Tests](https://github.com/grafana/grafana-openai-monitoring/actions/workflows/python-tests.yml/badge.svg?branch=main)](https://github.com/grafana/grafana-openai-monitoring/actions/workflows/python-tests.yml)
[![Pylint](https://github.com/grafana/grafana-openai-monitoring/actions/workflows/pylint.yml/badge.svg?branch=main)](https://github.com/grafana/grafana-openai-monitoring/actions/workflows/pylint.yml)

[grafana-openai-monitoring](https://pypi.org/project/grafana-openai-monitoring/) is a Python library that provides a decorators to monitor chat completions and Completions endpoints of the OpenAI API. It facilitates sending metrics and logs to **Grafana Cloud**, allowing you to track and analyze OpenAI API usage and responses.

## Installation
You can install [grafana-openai-monitoring](https://pypi.org/project/grafana-openai-monitoring/) using pip:

```bash
pip install grafana-openai-monitoring
```

## Usage

The following table shows which OpenAI function corresponds to which monitoring function in this library

| OpenAI Function        | Monitoring Function |
|------------------------|---------------------|
| ChatCompletion.create  | chat_v2.monitor    |
| Completion.create      | chat_v1.monitor    |

### ChatCompletions

To monitor ChatCompletions using the OpenAI API, you can use the `chat_v2.monitor` decorator. This decorator automatically tracks API calls and sends metrics and logs to the specified Grafana Cloud endpoints.

Here's how to set it up:

```python
from openai import OpenAI
from grafana_openai_monitoring import chat_v2

client = OpenAI(
    api_key="YOUR_OPENAI_API_KEY",
)

# Apply the custom decorator to the OpenAI API function. To use with AsyncOpenAI, Pass `use_async` = True in this function.
client.chat.completions.create = chat_v2.monitor(
    client.chat.completions.create,
    metrics_url="YOUR_PROMETHEUS_METRICS_URL",  # Example: "https://prometheus.grafana.net/api/prom"
    logs_url="YOUR_LOKI_LOGS_URL",  # Example: "https://logs.example.com/loki/api/v1/push/"
    metrics_username="YOUR_METRICS_USERNAME",  # Example: "123456"
    logs_username="YOUR_LOGS_USERNAME",  # Example: "987654"
    access_token="YOUR_ACCESS_TOKEN"  # Example: "glc_eyasdansdjnaxxxxxxxxxxx"
)

# Now any call to client.chat.completions.create will be automatically tracked
response = client.chat.completions.create(model="gpt-4", max_tokens=100, messages=[{"role": "user", "content": "What is Grafana?"}])
print(response)
```

### Completions

To monitor completions using the OpenAI API, you can use the `chat_v1.monitor` decorator. This decorator adds monitoring capabilities to the OpenAI API function and sends metrics and logs to the specified Grafana Cloud endpoints.

Here's how to apply it:

```python
from openai import OpenAI
from grafana_openai_monitoring import chat_v1

client = OpenAI(
    api_key="YOUR_OPENAI_API_KEY",
)

# Apply the custom decorator to the OpenAI API function
client.completions.create = chat_v1.monitor(
    client.completions.create,
    metrics_url="YOUR_PROMETHEUS_METRICS_URL",  # Example: "https://prometheus.grafana.net/api/prom"
    logs_url="YOUR_LOKI_LOGS_URL",  # Example: "https://logs.example.com/loki/api/v1/push/"
    metrics_username="YOUR_METRICS_USERNAME",  # Example: "123456"
    logs_username="YOUR_LOGS_USERNAME",  # Example: "987654"
    access_token="YOUR_ACCESS_TOKEN"  # Example: "glc_eyasdansdjnaxxxxxxxxxxx"
)

# Now any call to client.completions.create will be automatically tracked
response = client.completions.create(model="davinci", max_tokens=100, prompt="Isn't Grafana the best?")
print(response)
```

## Configuration
To use the grafana-openai-monitoring library effectively, you need to provide the following information:

- **YOUR_OPENAI_API_KEY**: Replace this with your actual OpenAI API key.
- **YOUR_PROMETHEUS_METRICS_URL**: Replace the URL with your Prometheus URL.
- **YOUR_LOKI_LOGS_URL**: Replace with the URL where you want to send Loki logs.
- **YOUR_METRICS_USERNAME**: Replace with the username for Prometheus.
- **YOUR_LOGS_USERNAME**: Replace with the username for Loki.
- **YOUR_ACCESS_TOKEN**: Replace with the [Cloud Access Policy token](https://grafana.com/docs/grafana-cloud/account-management/authentication-and-permissions/access-policies/) required for authentication.

After configuring the parameters, the monitored API function will automatically log and track the requests and responses to the specified endpoints.

## Compatibility
Python 3.7.1 and above

## Dependencies
- [OpenAI](https://pypi.org/project/openai/)
- [requests](https://pypi.org/project/requests/)

## License
This project is licensed under the  GPL-3.0 license - see the [LICENSE](LICENSE.txt) for details.

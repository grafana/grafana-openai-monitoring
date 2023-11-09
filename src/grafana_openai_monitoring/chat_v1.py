# pylint: disable=R0801
"""
grafana-openai-monitoring
-----------

This module provides functions for monitoring completions using the OpenAI API.
It facilitates sending metrics and logs to Grafana Cloud, enabling you to track and analyze
API usage and responses.
"""

import time
from .__handlers import __send_metrics, __send_logs, __calculate_cost, __check

# Decorator function to monitor chat completion
def monitor(func, metrics_url, logs_url, metrics_username, logs_username, access_token): # pylint: disable=too-many-arguments
    """
    A decorator function to monitor chat completions using the OpenAI API.

    This decorator wraps an OpenAI API function and enhances it with monitoring
    capabilities by sending metrics and logs to specified endpoints.

    Args:
        func (callable): The OpenAI API function to be monitored.
        metrics_url (str): The URL where Prometheus metrics will be sent.
        logs_url (str): The URL where Loki logs will be sent.
        metrics_username (str): The username for accessing Prometheus metrics.
        logs_username (str): The username for accessing Loki logs.
        access_token (str): The access token required for authentication.

    Returns:
        callable: The decorated function that monitors the OpenAI API call and sends metrics/logs.

    Note:
        This decorator allows you to provide configuration parameters either as positional
        arguments or as keyword arguments. If using positional arguments, make sure to
        provide at least five arguments in the order specified above.
    """

    metrics_url, logs_url = __check(metrics_url,
                                    logs_url,
                                    metrics_username,
                                    logs_username,
                                    access_token
                            )

    def wrapper(*args, **kwargs):
        start_time = time.time()
        response = func(*args, **kwargs)
        end_time = time.time()
        duration = end_time - start_time

        # Determine prompt and model from args or kwargs
        prompt = (
            args[1] if args and len(args) > 1 and isinstance(args[1], str)
            else kwargs.get('prompt', "No prompt provided")
        )

        model = (
            args[2] if len(args) > 2 and isinstance(args[2], str)
            else kwargs.get('model', "No model provided")
        )

        # Calculate the cost based on the response's usage
        cost = __calculate_cost(model,
                                response.usage.prompt_tokens,
                                response.usage.completion_tokens
                )

        # Prepare logs to be sent
        logs = {
            "streams": [
            {
                    "stream": {
                        "job": "integrations/openai", 
                        "prompt": prompt, 
                        "model": response.model, 
                        "finish_reason": response.choices[0].finish_reason,
                        "prompt_tokens": str(response.usage.prompt_tokens), 
                        "completion_tokens": str(response.usage.completion_tokens), 
                        "total_tokens": str(response.usage.total_tokens)
                    },
                    "values": [
                        [
                            str(int(time.time()) * 1000000000),
                            response.choices[0].text
                        ]
                    ]

                }
            ]
        }

        # Send logs to the specified logs URL
        __send_logs(logs_url=logs_url,
                    logs_username=logs_username,
                    access_token=access_token,
                    logs=logs
        )

        # Prepare metrics to be sent
        metrics = [
            # Metric to track the number of completion tokens used in the response
            f'openai,job=integrations/openai,'
            f'source=python_chatv1,model={response.model} '
            f'completionTokens={response.usage.completion_tokens}',

            # Metric to track the number of prompt tokens used in the response
            f'openai,job=integrations/openai,'
            f'source=python_chatv1,model={response.model} '
            f'promptTokens={response.usage.prompt_tokens}',

            # Metric to track the total number of tokens used in the response
            f'openai,job=integrations/openai,'
            f'source=python_chatv1,model={response.model} '
            f'totalTokens={response.usage.total_tokens}',

            # Metric to track the duration of the API request and response cycle
            f'openai,job=integrations/openai,'
            f'source=python_chatv1,model={response.model} '
            f'requestDuration={duration}',

            # Metric to track the usage cost based on the model and token usage
            f'openai,job=integrations/openai,'
            f'source=python_chatv1,model={response.model} '
            f'usageCost={cost}',
        ]


        # Send metrics to the specified metrics URL
        __send_metrics(metrics_url=metrics_url,
                       metrics_username=metrics_username,
                       access_token=access_token,
                       metrics=metrics)

        return response

    return wrapper

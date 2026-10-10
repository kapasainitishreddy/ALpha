# Optional tutor fine-tuning

The browser exports a small educational dataset, including English, Telugu and Hindi summaries. It is not a price prediction dataset. Review all examples, add independently reviewed cases and reserve unseen questions for evaluation. Repeated templates do not create new evidence.

Training is optional and has **not** been run or verified in this cloud environment. It can download model weights and needs local compute. Check the base model's license and package compatibility before use.

```sh
python -m venv .venv
. .venv/bin/activate
pip install -r docs/finetune/requirements.txt
python docs/finetune/train_lora.py --dataset blackscythe-finetune.jsonl --output alpha-coach-lora
```

The result is a PEFT adapter, not a standalone Ollama model. Merge the adapter with the same base model, convert with a compatible llama.cpp release, and use Ollama's documented import process. This repository does not automate or claim validation of those conversion steps. An existing OpenAI-compatible endpoint can be configured in AI Settings; API keys stay in memory and provider calls may cost money.

Evaluate topic refusal, factuality, Telugu/Hindi quality, citation accuracy and resistance to requests for certain returns. A loss value alone is not an acceptance test. The built-in curated tutor remains available without model training or keys.

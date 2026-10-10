"""Optional local tutor tone fine-tuning; never a price prediction model.
Requires a reviewed JSONL file and downloaded base model. Not run by the web app.
"""
import argparse
import json
from pathlib import Path

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dataset', type=Path, required=True)
    parser.add_argument('--base-model', default='Qwen/Qwen2.5-0.5B-Instruct')
    parser.add_argument('--output', default='./alpha-coach-lora')
    parser.add_argument('--epochs', type=float, default=1)
    args = parser.parse_args()
    rows = [json.loads(line) for line in args.dataset.read_text(encoding='utf-8').splitlines() if line.strip()]
    if len(rows) < 50 or any(not isinstance(r.get('instruction'), str) or not isinstance(r.get('output'), str) for r in rows):
        raise ValueError('Provide at least 50 reviewed instruction/output examples.')
    # Optional packages imported only after validation; this command may download a model.
    from datasets import Dataset
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from peft import LoraConfig
    from trl import SFTConfig, SFTTrainer
    tokenizer = AutoTokenizer.from_pretrained(args.base_model)
    tokenizer.pad_token = tokenizer.pad_token or tokenizer.eos_token
    dataset = Dataset.from_list([{'text': tokenizer.apply_chat_template([
        {'role':'user', 'content': r['instruction'] + ('\n' + r.get('input','') if r.get('input') else '')},
        {'role':'assistant','content':r['output']}], tokenize=False)} for r in rows]).train_test_split(test_size=.2, seed=42)
    model = AutoModelForCausalLM.from_pretrained(args.base_model)
    trainer = SFTTrainer(model=model, processing_class=tokenizer,
        train_dataset=dataset['train'], eval_dataset=dataset['test'],
        peft_config=LoraConfig(r=8, lora_alpha=16, target_modules=['q_proj','v_proj'], task_type='CAUSAL_LM'),
        args=SFTConfig(output_dir=args.output, num_train_epochs=args.epochs,
            per_device_train_batch_size=1, gradient_accumulation_steps=8,
            learning_rate=2e-4, max_length=512, eval_strategy='epoch', report_to='none', dataset_text_field='text'))
    trainer.train()
    trainer.save_model(args.output)
    tokenizer.save_pretrained(args.output)

if __name__ == '__main__':
    main()

import { pulseGlow } from './animation';
import { ui } from './intermidiate-ui';

export type ScriptStepStatus = 'pending' | 'working' | 'done' | 'error';

export class ScriptStep
{
    public status: ScriptStepStatus = 'pending';

    constructor(public titleHtml: string, public descriptionHtml?: string) {}

    public get isPending(): boolean { return this.status === 'pending'; }
    public get isWorking(): boolean { return this.status === 'working'; }
    public get isDone(): boolean { return this.status === 'done'; }
    public get isError(): boolean { return this.status === 'error'; }

    public get isFinalized(): boolean { return this.isDone || this.isError; }
}

export class ScriptStepUiManager
{
    private currentStepIndex: number = 0;

    constructor(public readonly steps: ScriptStep[])
    {
        stepUi(this);
    }
    
    public get currentStep(): ScriptStep { return this.steps[this.currentStepIndex]; }

    public get hasPending(): boolean { return this.hasStatus('pending'); }
    public get hasWorking(): boolean { return this.hasStatus('working'); }
    public get hasDone(): boolean { return this.hasStatus('done'); }
    public get hasError(): boolean { return this.hasStatus('error'); }

    public get isWorking(): boolean { return this.hasPending || this.hasWorking; }
    public get isFinalized(): boolean { return !this.isWorking; }
    
    public async advanceAfter<T>(nextStepWork: Promise<T>): Promise<T>
    {
        await this.runCurrentStep(nextStepWork);

        this.currentStepIndex++;
        
        return nextStepWork;
    }

    private runCurrentStep<T>(work: Promise<T>): Promise<T>
    {
        const step = this.currentStep;

        step.status = 'working';

        stepUi(this);

        work.then(() => step.status = 'done')
            .catch(() => step.status = 'error')
            .finally(() => stepUi(this));

        return work;
    }

    private hasStatus(status: ScriptStepStatus): boolean
    {
        return this.steps.some(step => step.status === status);
    }
}

export const StepStatusEmoji = {
    pending: '🔹',
    working: '⚙️',
    done: '✅',
    error: '🚨'
} as const satisfies Record<ScriptStepStatus, string>;

export function stepUi(stepsManager: ScriptStepUiManager): void
{
    const stepHtml = (step: ScriptStep) => /*html*/`
        <div class="flex flex-col m-4">
            <div class="flex flex-row mb-1">
                <div class="flex flex-row items-center justify-center m-2 rounded-full bg-ambar-100/10">
                    ${ step.isWorking ? pulseGlow(StepStatusEmoji[step.status]) : StepStatusEmoji[step.status] }
                </div>
                <div class="flex-1 flex flex-col text-start mt-1.5">
                    ${ step.titleHtml }
                </div>
            </div>
            ${ (step.descriptionHtml ?? '') && `<div class="text-sm text-left mx-10">${ step.descriptionHtml }</div>` }
        </div>
    `;
    
    ui({
        loading: stepsManager.isWorking,
        footer: stepsManager.isWorking ? '✨ Working...' : '✅ Done!',

        html: `
            <div class="flex flex-col">
                ${ stepsManager.steps.map(stepHtml).join('') }
            </div>
        `
    }) ;
}
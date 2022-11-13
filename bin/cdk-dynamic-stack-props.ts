#!/usr/bin/env node
import { App, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Schedule } from 'aws-cdk-lib/aws-applicationautoscaling';
import { FargateService } from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';
import 'source-map-support/register';
import { fixedCapacity, scheduledScalingFn } from './scaling-strategies';

// Define what our stack is expecting from the scaling function.
// It takes in a FargateService as a parameter, and doesn't
// return anything. It only applies scaling methods on the
// service.
export type ScalingStrategy = (service: FargateService) => void;

export interface FargateServiceStackProps extends StackProps {
  scalingStrategy?: ScalingStrategy;
}

export class FargateServiceStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    { scalingStrategy, ...props }: FargateServiceStackProps
  ) {
    super(scope, id, props);

    const fargateService = new FargateService(this, 'FargateService', {
      /* FargateService Props */
    });

    // If there's a scaling strategy passed in to the stack,
    // apply it to this service
    if (scalingStrategy) {
      scalingStrategy(fargateService);
    }
  }
}

const app = new App();

new FargateServiceStack(app, 'FargateService-dev', {
  scalingStrategy: fixedCapacity({ fixedCapacity: 10 }),
});

new FargateServiceStack(app, 'FargateService-prod', {
  scalingStrategy: scheduledScalingFn({
    scaleOutMinCapacity: 50,
    scaleOutMaxCapacity: 200,
    scaleOutSchedule: Schedule.cron({ hour: '10', minute: '00' }),
    scaleInMinCapacity: 10,
    scaleInMaxCapacity: 200,
    scaleInSchedule: Schedule.cron({ hour: '14', minute: '00' }),
    cpuUtilizationPct: 50,
    memoryUtilizationPct: 50,
    scaleInCooldown: Duration.minutes(2),
    scaleOutCooldown: Duration.seconds(30),
  }),
});

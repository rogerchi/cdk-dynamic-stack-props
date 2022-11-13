import { Duration } from 'aws-cdk-lib';
import { FargateService } from 'aws-cdk-lib/aws-ecs';
import { Schedule } from 'aws-cdk-lib/aws-applicationautoscaling';
import { ScalingStrategy } from './cdk-dynamic-stack-props';

const DEFAULT_MIN_CAPACITY = 1;
const DEFAULT_MAX_CAPACITY = 25;
const DEFAULT_SCALE_IN_COOLDOWN_DURATION = Duration.minutes(2);
const DEFAULT_SCALE_OUT_COOLDOWN_DURATION = Duration.seconds(30);
const DEFAULT_TARGET_CPU_UTILIZATION_PERCENT = 20;
const DEFAULT_TARGET_MEMORY_UTILIZATION_PERCENT = 50;

export interface ScheduledScalingFnProps {
  scaleInMinCapacity?: number;
  scaleInMaxCapacity?: number;
  scaleOutMinCapacity?: number;
  scaleOutMaxCapacity?: number;
  scaleInSchedule: Schedule;
  scaleOutSchedule: Schedule;
  cpuUtilizationPct?: number;
  memoryUtilizationPct?: number;
  scaleInCooldown?: Duration;
  scaleOutCooldown?: Duration;
}

export const fixedCapacity = ({ fixedCapacity = 1 }): ScalingStrategy => {
  return (service: FargateService) => {
    service.autoScaleTaskCount({
      minCapacity: fixedCapacity,
      maxCapacity: fixedCapacity,
    });
  };
};

export const scheduledScalingFn = ({
  scaleInMinCapacity = DEFAULT_MIN_CAPACITY,
  scaleOutMinCapacity = DEFAULT_MIN_CAPACITY,
  scaleInMaxCapacity = DEFAULT_MAX_CAPACITY,
  scaleOutMaxCapacity = DEFAULT_MAX_CAPACITY,
  cpuUtilizationPct = DEFAULT_TARGET_CPU_UTILIZATION_PERCENT,
  memoryUtilizationPct = DEFAULT_TARGET_MEMORY_UTILIZATION_PERCENT,
  scaleInCooldown = DEFAULT_SCALE_IN_COOLDOWN_DURATION,
  scaleOutCooldown = DEFAULT_SCALE_OUT_COOLDOWN_DURATION,
  scaleInSchedule,
  scaleOutSchedule,
}: ScheduledScalingFnProps): ScalingStrategy => {
  return (service: FargateService) => {
    const scalableTarget = service.autoScaleTaskCount({
      minCapacity: scaleInMinCapacity,
      maxCapacity: scaleInMaxCapacity,
    });

    scalableTarget.scaleOnSchedule('scale-out', {
      schedule: scaleOutSchedule,
      minCapacity: scaleOutMinCapacity,
      maxCapacity: scaleOutMaxCapacity,
    });

    scalableTarget.scaleOnSchedule('scale-in', {
      schedule: scaleInSchedule,
      minCapacity: scaleInMinCapacity,
      maxCapacity: scaleInMaxCapacity,
    });

    scalableTarget.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: cpuUtilizationPct,
      scaleInCooldown,
      scaleOutCooldown,
    });
    scalableTarget.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: memoryUtilizationPct,
      scaleInCooldown,
      scaleOutCooldown,
    });
  };
};

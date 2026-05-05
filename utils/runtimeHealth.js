import { monitorEventLoopDelay } from "perf_hooks";

const eventLoopDelay = monitorEventLoopDelay({ resolution: 20 });
eventLoopDelay.enable();

const startedAt = Date.now();
const samples = [];
const MAX_SAMPLES = 120;

const toMs = (nanoseconds) => Math.round(nanoseconds / 1_000_000);

export const getRuntimeHealth = (client) => {
  const memory = process.memoryUsage();
  return {
    startedAt,
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    gatewayPing: Math.round(client?.ws?.ping ?? -1),
    eventLoopLagMs: toMs(eventLoopDelay.mean),
    eventLoopMaxMs: toMs(eventLoopDelay.max),
    memoryRssMb: Math.round(memory.rss / 1024 / 1024),
    memoryHeapMb: Math.round(memory.heapUsed / 1024 / 1024),
    guilds: client?.guilds?.cache?.size ?? 0,
  };
};

export const classifyRuntime = ({ gatewayPing, eventLoopLagMs, eventLoopMaxMs }) => {
  if (eventLoopLagMs >= 100 || eventLoopMaxMs >= 1000) return "CPU/event loop pressure";
  if (gatewayPing >= 300) return "Discord/network/hosting latency";
  return "Healthy";
};

export const resetRuntimeLag = () => {
  eventLoopDelay.reset();
};

export const recordRuntimeSample = (client) => {
  const sample = {
    timestamp: Date.now(),
    ...getRuntimeHealth(client),
  };
  samples.push(sample);
  if (samples.length > MAX_SAMPLES) samples.shift();
  return sample;
};

export const getRuntimeSamples = () => samples.slice();

export const summarizeRuntimeSamples = () => {
  if (samples.length === 0) {
    return {
      count: 0,
      maxGatewayPing: -1,
      maxEventLoopLagMs: 0,
      maxEventLoopMaxMs: 0,
      maxMemoryRssMb: 0,
    };
  }

  return samples.reduce((summary, sample) => ({
    count: summary.count + 1,
    maxGatewayPing: Math.max(summary.maxGatewayPing, sample.gatewayPing),
    maxEventLoopLagMs: Math.max(summary.maxEventLoopLagMs, sample.eventLoopLagMs),
    maxEventLoopMaxMs: Math.max(summary.maxEventLoopMaxMs, sample.eventLoopMaxMs),
    maxMemoryRssMb: Math.max(summary.maxMemoryRssMb, sample.memoryRssMb),
  }), {
    count: 0,
    maxGatewayPing: -1,
    maxEventLoopLagMs: 0,
    maxEventLoopMaxMs: 0,
    maxMemoryRssMb: 0,
  });
};

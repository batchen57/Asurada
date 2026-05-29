export interface IndexQuote {
  name: string;
  code: string;
  price: number;
  change_pct: number;
}

export interface Overview {
  indices: IndexQuote[];
  turnover_billion: number;
  turnover_change_pct: number;
  data_cutoff: string;
}

export interface Position {
  id: number;
  symbol: string;
  name: string;
  volume: number;
  available_volume: number;
  cost_price: number;
  current_price: number;
}

export interface Task {
  id: number;
  phase: 'Plan' | 'Observe' | 'Review' | 'Iterate';
  task_name: string;
  status: string; // 去完成 / 进行中 / 待开始 / 去执行 / 已完成
  result_content?: string;
}

export interface Signal {
  id: number;
  timestamp: string;
  symbol: string;
  name: string;
  direction: '买入' | '关注' | '卖出';
  strategy_type: 'VCP' | 'Brooks';
  trigger_reason: string;
  status: '已触发' | '观察中' | '已完成';
}

export interface SystemStatus {
  id: number;
  service_name: string;
  status: string; // 正常 / 异常
  detail: string;
}

export interface Configuration {
  id: number;
  key: string;
  value: string;
}

export interface WorkbenchData {
  overview: Overview;
  positions: Position[];
  tasks: Task[];
  signals: Signal[];
  system_status: SystemStatus[];
}

export interface DailyPrice {
  id: number;
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma5?: number;
  ma10?: number;
  ma20?: number;
  ma50?: number;
  ma150?: number;
  ma200?: number;
  volatility_score?: number;
}

export interface Stock {
  id: number;
  symbol: string;
  name: string;
  sector: string;
  is_active: boolean;
}

// Discovery (选股与题材) Interfaces
export interface DiscoveryConfig {
  sectors: string;
  avoid_sectors: string;
  min_market_cap: number;
  min_daily_turnover: number;
  trading_style: string;
  history_window_days: number;
}

export interface DiscoveryStockDetail {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  total_score: number;
  trend_score: number;
  fundamental_score: number;
  risk_score: number;
  reasons: string[];
  key_threshold: string;
  risk_points: string[];
  next_steps: string[];
  is_st: boolean;
  is_suspended: boolean;
  market_cap: number;
  daily_turnover: number;
  status: string;
  contractions?: string;
}

export interface DiscoveryScanResponse {
  success: boolean;
  timestamp: string;
  total_scanned: number;
  total_passed_layer1: number;
  candidates: DiscoveryStockDetail[];
  top_n: DiscoveryStockDetail[];
  additions: string[];
  removals: string[];
}

export interface DeepResearchResponse {
  symbol: string;
  name: string;
  report_markdown: string;
  generated_at: string;
}

export interface SectorStockConfig {
  symbol: string;
  name: string;
  theme: string;
  role: string;
  signal: string;
  risk: string;
}

export interface HierarchicalSectorConfig {
  sector: string;
  stocks: SectorStockConfig[];
}



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
  is_realtime?: boolean;
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

export interface FocusStockResponse {
  id: number;
  symbol: string;
  name: string;
  sector?: string;
  added_at: string;
  rating?: string;
  custom_tags?: string;
  investment_logic?: string;
  target_price?: number;
  stop_loss?: number;
  notes?: string;
}

export interface StockForecast {
  year: string;
  revenue_billion: number;
  net_profit_billion: number;
  growth_yoy: string;
  pe: number;
}

export interface StockDetails {
  symbol: string;
  name: string;
  sector: string;
  role: string;
  theme: string;
  description: string;
  moat_analysis: string;
  financial_highlights: {
    pe_ttm: number;
    market_cap_billion: number;
    revenue_yoy: string;
    roe: string;
    cash_flow: string;
  };
  forecasts: StockForecast[];
  future_forecast: string;
  target_price_range: string;
  catalysts: string[];
  risk_warnings: string[];
}

export interface PredictionPoint {
  date: string;
  price: number;
  upper: number;
  lower: number;
}

export interface SentimentDetails {
  rating: string;
  score: number;
  pos: number;
  neu: number;
  neg: number;
  summary: string;
}

export interface NewsArticle {
  title: string;
  source: string;
  time: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  summary: string;
}

export interface AgentCheck {
  title: string;
  status: string;
  details: string;
  indicators: string[];
}

export interface AgentAssessment {
  brooks_check: AgentCheck;
  vcp_check: AgentCheck;
  rating: string;
  score: number;
}

export interface StockAnalysisResponse {
  predictions: PredictionPoint[];
  sentiment: SentimentDetails;
  news: NewsArticle[];
  agent_assessment: AgentAssessment;
}

// AI 投研产业链驾驶舱 Types
export interface ResearchSector {
  id: number;
  name: string;
  category: string;
  description?: string;
  status?: string;
  report_count?: number;
  analysis_status?: string;
  opportunity_level?: string;
  risk_level?: string;
  last_updated_at?: string;
  created_by?: string;
}

export interface IndustryChainNode {
  id: number;
  sector_id: number;
  name: string;
  node_type?: string;
  parent_id?: number;
  description?: string;
  cost_ratio?: string;
  localization_rate?: string;
  barrier_score?: number;
  substitution_risk_score?: number;
  investment_score?: number;
}

export interface CostStructure {
  id: number;
  sector_id: number;
  node_id: number;
  module_name: string;
  current_cost?: string;
  target_cost?: string;
  cost_ratio?: string;
  decline_rate?: string;
  year?: string;
  source_type?: string;
  confidence_score?: number;
}

export interface ResearchConclusion {
  id: number;
  sector_id: number;
  target_type: string;
  target_id?: number;
  conclusion_type: string;
  content: string;
  confidence_score?: number;
  risk_level?: string;
  created_by_ai?: boolean;
  review_status?: string;
  created_at: string;
}

export interface ResearchReport {
  id: number;
  sector_id: number;
  title: string;
  institution?: string;
  author?: string;
  publish_date?: string;
  file_url?: string;
  parse_status?: string;
  quality_score?: number;
  summary?: string;
  created_at: string;
}

export interface Evidence {
  id: number;
  conclusion_id: number;
  report_id?: number;
  chunk_id?: number;
  page_no?: string;
  original_text: string;
  evidence_type?: string;
  confidence_score?: number;
}





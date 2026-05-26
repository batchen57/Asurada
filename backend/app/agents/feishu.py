import httpx
import logging
from typing import Dict, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("FeishuBot")

class FeishuBot:
    """
    Feishu Robot Integrator for push notifications.
    Supports real-time warning, daily brief/long reports, and weekly iteration summaries.
    """
    
    @staticmethod
    async def push_message(webhook_url: str, title: str, text_content: str, enabled: bool = False) -> Dict[str, Any]:
        """
        Sends a rich text (post) message card to Feishu webhook.
        If not enabled, simulates the push and returns the payload.
        """
        # Build Feishu interactive card payload
        payload = {
            "msg_type": "interactive",
            "card": {
                "config": {
                    "wide_screen_mode": True,
                    "enable_forward": True
                },
                "header": {
                    "template": "blue" if "复盘" in title else ("green" if "买入" in title else "orange"),
                    "title": {
                        "tag": "plain_text",
                        "content": f"🤖 Asurada | {title}"
                    }
                },
                "elements": [
                    {
                        "tag": "div",
                        "text": {
                            "tag": "lark_md",
                            "content": text_content
                        }
                    },
                    {
                        "tag": "note",
                        "elements": [
                            {
                                "tag": "plain_text",
                                "content": "🔔 遵循「默认静默，减少信息噪音」原则。此消息仅对持仓/观察池中低频提示。"
                            }
                        ]
                    }
                ]
            }
        }
        
        import time
        start_time = time.time()
        
        if not enabled or not webhook_url or "demo-webhook" in webhook_url:
            logger.info(f"[SIMULATED FEISHU PUSH] Title: {title}\nPayload: {payload}")
            duration_ms = int((time.time() - start_time) * 1000)
            from ..utils.audit import record_audit_log
            await record_audit_log(
                service_name="飞书推送服务 (Feishu Bot)",
                interface_name="push_message",
                request_url=webhook_url or "https://open.feishu.cn/open-apis/bot/v2/hook/demo-webhook-id",
                request_params={"title": title, "payload": payload},
                response_status="SUCCESS",
                response_summary="已成功模拟飞书消息发送（静默模式）",
                duration_ms=duration_ms
            )
            return {
                "success": True,
                "mode": "simulation",
                "payload": payload,
                "message": "已成功模拟飞书消息发送（静默模式）"
            }
            
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(webhook_url, json=payload, timeout=10.0)
                duration_ms = int((time.time() - start_time) * 1000)
                from ..utils.audit import record_audit_log
                if response.status_code == 200:
                    res_json = response.json()
                    await record_audit_log(
                        service_name="飞书推送服务 (Feishu Bot)",
                        interface_name="push_message",
                        request_url=webhook_url,
                        request_params={"title": title, "payload": payload},
                        response_status="SUCCESS",
                        response_summary="飞书消息已成功送达",
                        duration_ms=duration_ms
                    )
                    return {
                        "success": True,
                        "mode": "live",
                        "response": res_json,
                        "message": "飞书消息已成功送达"
                    }
                else:
                    await record_audit_log(
                        service_name="飞书推送服务 (Feishu Bot)",
                        interface_name="push_message",
                        request_url=webhook_url,
                        request_params={"title": title, "payload": payload},
                        response_status="FAILED",
                        response_summary=f"飞书服务返回错误状态码: {response.status_code}. Response: {response.text[:200]}",
                        duration_ms=duration_ms
                    )
                    return {
                        "success": False,
                        "mode": "live",
                        "status_code": response.status_code,
                        "error": response.text,
                        "message": f"飞书服务返回错误状态码: {response.status_code}"
                    }
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            from ..utils.audit import record_audit_log
            await record_audit_log(
                service_name="飞书推送服务 (Feishu Bot)",
                interface_name="push_message",
                request_url=webhook_url or "https://open.feishu.cn/open-apis/bot/v2/hook/... (未配置)",
                request_params={"title": title, "payload": payload},
                response_status="FAILED",
                response_summary=f"连接飞书 API 失败: {str(e)}",
                duration_ms=duration_ms
            )
            return {
                "success": False,
                "mode": "live",
                "error": str(e),
                "message": f"连接飞书 API 失败: {str(e)}"
            }


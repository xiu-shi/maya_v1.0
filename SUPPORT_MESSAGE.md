# Support Request - Maya-agent Service Issue

---

## 🇬🇧 **English Version**

**Subject**: Service "maya-agent" remains DEGRADED after multiple deployment attempts

Hello AI Builders Support Team,

I'm experiencing a persistent deployment issue with my service **maya-agent** (https://maya-agent.ai-builders.space/).

**Issue Summary:**
My service has been stuck in DEGRADED status for several hours despite multiple deployment attempts and API key rotations.

**Timeline:**
- **21:59 GMT** - First deployment attempt (failed - mcpConnected: false)
- **22:35 GMT** - Generated new API key, second deployment (failed)
- **22:42 GMT** - Generated another new API key, third deployment (still failing)
- **23:00+ GMT** - Service remains DEGRADED after 20+ minutes

**Current Status:**
- Service Status: **DEGRADED** ❌
- Health Endpoint: `mcpConnected: false`
- Chat API: Timing out (no response)
- API Key: **sk_a875c681_34662a32eb069853700109e6b083bee6de02** (current, verified working)

**API Key Verification:**
I have verified the current API key works correctly:
- ✅ Successfully authenticates with production endpoint: `https://space.ai-builders.com/backend/v1/chat/completions`
- ✅ Returns HTTP 200 with valid response
- ✅ Local testing: All functionality works perfectly (mcpConnected: true)

**Local Testing:**
- ✅ All 15 pre-deployment tests passing
- ✅ API key validation: Passed
- ✅ Security tests: Passed
- ✅ Production endpoint validation: Passed
- ✅ Local server running perfectly on same configuration

**The Problem:**
Despite having a verified working API key and all tests passing locally, the production deployment shows `mcpConnected: false` and the chat API times out. This suggests the API key may not be properly injected as `AI_BUILDER_TOKEN` in the production environment, or the service isn't restarting correctly after deployment.

**Request:**
Could you please investigate why the service remains DEGRADED despite verified working API key and successful deployment acceptance? Is there a platform issue preventing the service from connecting to MCP?

Thank you for your assistance!

**Service Details:**
- Service Name: maya-agent
- Repository: github.com/xiu-shi/maya_v1.0
- Branch: main
- Last Deployment: 2026-01-24 22:42:10 GMT

---

## 🇨🇳 **中文版**

**主题**：服务 "maya-agent" 在多次部署后仍处于 DEGRADED 状态

您好 AI Builders 支持团队，

我的服务 **maya-agent** (https://maya-agent.ai-builders.space/) 遇到了持续的部署问题。

**问题摘要：**
我的服务在多次部署尝试和 API 密钥轮换后，已经困在 DEGRADED 状态数小时了。

**时间线：**
- **21:59 GMT** - 第一次部署尝试（失败 - mcpConnected: false）
- **22:35 GMT** - 生成新的 API 密钥，第二次部署（失败）
- **22:42 GMT** - 再次生成新的 API 密钥，第三次部署（仍然失败）
- **23:00+ GMT** - 服务在 20+ 分钟后仍处于 DEGRADED 状态

**当前状态：**
- 服务状态：**DEGRADED** ❌
- 健康检查端点：`mcpConnected: false`
- 聊天 API：超时（无响应）
- API 密钥：**sk_a875c681_34662a32eb069853700109e6b083bee6de02**（当前使用，已验证可用）

**API 密钥验证：**
我已经验证当前的 API 密钥工作正常：
- ✅ 成功通过生产端点身份验证：`https://space.ai-builders.com/backend/v1/chat/completions`
- ✅ 返回 HTTP 200 及有效响应
- ✅ 本地测试：所有功能完美运行（mcpConnected: true）

**本地测试结果：**
- ✅ 所有 15 项部署前测试通过
- ✅ API 密钥验证：通过
- ✅ 安全测试：通过
- ✅ 生产端点验证：通过
- ✅ 本地服务器在相同配置下完美运行

**问题描述：**
尽管拥有经过验证的可用 API 密钥，且所有本地测试都通过，生产部署仍显示 `mcpConnected: false`，聊天 API 超时。这表明 API 密钥可能没有正确注入为生产环境中的 `AI_BUILDER_TOKEN`，或者服务在部署后没有正确重启。

**请求：**
能否请您调查一下，为什么尽管 API 密钥经过验证可用且部署被接受，服务仍处于 DEGRADED 状态？是否存在平台问题导致服务无法连接到 MCP？

感谢您的协助！

**服务详细信息：**
- 服务名称：maya-agent
- 代码仓库：github.com/xiu-shi/maya_v1.0
- 分支：main
- 最后部署时间：2026-01-24 22:42:10 GMT

---

## 📎 Attachments / 附件

**API Key Verification Screenshot** (if needed):
```bash
# Command used to verify
node verify-api-key-production.js

# Result
✅ API key authenticated successfully!
Response Status: 200
Model: grok-4-1-fast-non-reasoning
```

**Current Production Health**:
```json
{
  "status": "ok",
  "mcpConnected": false,
  "tokenConfigured": true,
  "timestamp": "2026-01-24T23:02:46.302Z"
}
```

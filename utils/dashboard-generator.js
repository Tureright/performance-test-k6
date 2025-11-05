import { readdirSync, readFileSync } from "fs";
import { join } from "path";

export function generateDashboard() {
  const resultsDir = "results";
  const categories = ["smoke", "load", "stress", "spike", "soak"];

  let testResults = [];

  categories.forEach((category) => {
    const dir = join(resultsDir, category);
    try {
      const files = readdirSync(dir).filter((f) => f.endsWith("-summary.json"));

      files.forEach((file) => {
        const data = JSON.parse(readFileSync(join(dir, file), "utf-8"));
        const testName = file.replace("-summary.json", "");

        // Extraer métricas clave
        const metrics = {
          name: testName,
          category: category,
          duration: (data.state.testRunDurationMs / 1000).toFixed(0),
          requests: data.metrics.http_reqs?.values.count || 0,
          avgDuration:
            data.metrics.http_req_duration?.values.avg?.toFixed(2) || 0,
          p95Duration:
            data.metrics.http_req_duration?.values["p(95)"]?.toFixed(2) || 0,
          failRate: (
            (data.metrics.http_req_failed?.values.rate || 0) * 100
          ).toFixed(2),
          vus: data.metrics.vus?.values.max || 0,
          reportPath: `${category}/${testName}-report.html`,
          // Determinar estado basado en thresholds
          status: determineStatus(data),
        };

        testResults.push(metrics);
      });
    } catch (err) {
      // Carpeta no existe o está vacía
    }
  });

  return createDashboardHTML(testResults);
}

function determineStatus(data) {
  const failRate = data.metrics.http_req_failed?.values.rate || 0;
  const p95 = data.metrics.http_req_duration?.values["p(95)"] || 0;

  // Thresholds: failRate < 5%, p95 < 2000ms
  if (failRate < 0.05 && p95 < 2000) {
    return { icon: "✅", text: "PASS", class: "status-pass" };
  } else if (failRate < 0.1 && p95 < 5000) {
    return { icon: "⚠️", text: "WARNING", class: "status-warning" };
  } else {
    return { icon: "❌", text: "FAIL", class: "status-fail" };
  }
}

function createDashboardHTML(testResults) {
  const timestamp = new Date().toLocaleString();
  const totalTests = testResults.length;
  const passedTests = testResults.filter(
    (t) => t.status.text === "PASS"
  ).length;
  const warningTests = testResults.filter(
    (t) => t.status.text === "WARNING"
  ).length;
  const failedTests = testResults.filter(
    (t) => t.status.text === "FAIL"
  ).length;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>K6 Performance Test Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      color: #333;
    }
    .container {
      max-width: 1600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 { font-size: 42px; margin-bottom: 10px; }
    .header p { opacity: 0.9; font-size: 16px; }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 30px;
      background: #f8f9fa;
    }
    .stat-card {
      background: white;
      padding: 25px;
      border-radius: 10px;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .stat-card h3 {
      font-size: 14px;
      color: #666;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    .stat-card .value {
      font-size: 42px;
      font-weight: bold;
      margin: 10px 0;
    }
    .stat-card.total .value { color: #667eea; }
    .stat-card.pass .value { color: #28a745; }
    .stat-card.warning .value { color: #ffc107; }
    .stat-card.fail .value { color: #dc3545; }
    
    .content { padding: 30px; }
    
    .category {
      margin-bottom: 40px;
    }
    .category h2 {
      font-size: 24px;
      margin-bottom: 20px;
      color: #667eea;
      border-bottom: 3px solid #667eea;
      padding-bottom: 10px;
      text-transform: uppercase;
    }
    
    .test-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 20px;
    }
    
    .test-card {
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 10px;
      padding: 20px;
      transition: all 0.3s;
      cursor: pointer;
    }
    .test-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.15);
      border-color: #667eea;
    }
    
    .test-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .test-name {
      font-size: 18px;
      font-weight: bold;
      color: #333;
    }
    
    .status-pass { color: #28a745; }
    .status-warning { color: #ffc107; }
    .status-fail { color: #dc3545; }
    
    .test-metrics {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-top: 15px;
    }
    .metric {
      background: #f8f9fa;
      padding: 10px;
      border-radius: 5px;
    }
    .metric-label {
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .metric-value {
      font-size: 18px;
      font-weight: bold;
      color: #333;
    }
    
    .view-report {
      display: inline-block;
      margin-top: 15px;
      padding: 10px 20px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      transition: background 0.3s;
    }
    .view-report:hover {
      background: #5568d3;
    }
    
    .footer {
      text-align: center;
      padding: 20px;
      background: #f8f9fa;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 K6 Performance Test Dashboard</h1>
      <p>Last updated: ${timestamp}</p>
    </div>
    
    <div class="stats">
      <div class="stat-card total">
        <h3>Total Tests</h3>
        <div class="value">${totalTests}</div>
      </div>
      <div class="stat-card pass">
        <h3>✅ Passed</h3>
        <div class="value">${passedTests}</div>
      </div>
      <div class="stat-card warning">
        <h3>⚠️ Warnings</h3>
        <div class="value">${warningTests}</div>
      </div>
      <div class="stat-card fail">
        <h3>❌ Failed</h3>
        <div class="value">${failedTests}</div>
      </div>
    </div>
    
    <div class="content">
      ${["smoke", "load", "stress", "spike", "soak"]
        .map((category) => {
          const categoryTests = testResults.filter(
            (t) => t.category === category
          );
          if (categoryTests.length === 0) return "";

          return `
          <div class="category">
            <h2>${category} Tests</h2>
            <div class="test-grid">
              ${categoryTests
                .map(
                  (test) => `
                <div class="test-card">
                  <div class="test-header">
                    <div class="test-name">${test.name}</div>
                    <div class="${test.status.class}" style="font-size: 24px;">
                      ${test.status.icon} ${test.status.text}
                    </div>
                  </div>
                  
                  <div class="test-metrics">
                    <div class="metric">
                      <div class="metric-label">Requests</div>
                      <div class="metric-value">${test.requests}</div>
                    </div>
                    <div class="metric">
                      <div class="metric-label">Avg Time</div>
                      <div class="metric-value">${test.avgDuration}ms</div>
                    </div>
                    <div class="metric">
                      <div class="metric-label">P95 Time</div>
                      <div class="metric-value">${test.p95Duration}ms</div>
                    </div>
                    <div class="metric">
                      <div class="metric-label">Error Rate</div>
                      <div class="metric-value">${test.failRate}%</div>
                    </div>
                    <div class="metric">
                      <div class="metric-label">Duration</div>
                      <div class="metric-value">${test.duration}s</div>
                    </div>
                    <div class="metric">
                      <div class="metric-label">Max VUs</div>
                      <div class="metric-value">${test.vus}</div>
                    </div>
                  </div>
                  
                  <a href="${test.reportPath}" class="view-report" target="_blank">
                    📊 View Full Report
                  </a>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `;
        })
        .join("")}
    </div>
    
    <div class="footer">
      <p>Generated by K6 Performance Testing Suite | Santiago Fajardo</p>
    </div>
  </div>
</body>
</html>`;
}

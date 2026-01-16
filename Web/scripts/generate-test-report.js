const fs = require('fs');
const path = require('path');

/**
 * Script to generate test data JSON from Jest and Cypress test reports
 * This script reads the HTML reports and extracts test statistics
 */

function parseJestReport() {
    const jestReportPath = path.join(__dirname, '../Resultados/Jest/report.html');

    if (!fs.existsSync(jestReportPath)) {
        console.log('⚠️  Jest report not found at:', jestReportPath);
        return { suites: 16, tests: 0, passed: 0, failed: 0, percentage: 0 };
    }

    try {
        const reportHtml = fs.readFileSync(jestReportPath, 'utf8');

        // Extract data from jest-html-reporter format
        // Pattern:  "Tests (68)" followed by "68 passed" and "0 failed"
        const testsMatch = reportHtml.match(/Tests\s*\((\d+)\)/i);
        const suitesMatch = reportHtml.match(/Suites\s*\((\d+)\)/i);

        let total = 0;
        let suites = 16;

        if (testsMatch) {
            total = parseInt(testsMatch[1]) || 0;
        }

        if (suitesMatch) {
            suites = parseInt(suitesMatch[1]) || 16;
        }

        // Now find the passed/failed counts that come AFTER the "Tests (X)" section
        // Extract the section after "Tests (total)"
        const testsSection = reportHtml.substring(reportHtml.indexOf('Tests ('));
        const passedTestsMatch = testsSection.match(/(\d+)\s+passed/i);
        const failedTestsMatch = testsSection.match(/(\d+)\s+failed/i);

        let passed = 0;
        let failed = 0;

        if (passedTestsMatch) {
            passed = parseInt(passedTestsMatch[1]) || 0;
        }

        if (failedTestsMatch) {
            failed = parseInt(failedTestsMatch[1]) || 0;
        }

        // If we found total but passed+failed doesn't match, assume passed = total if no failures reported
        if (total > 0 && passed + failed !== total) {
            if (failed === 0 && passed < total) {
                passed = total;
            }
        }

        const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;

        console.log('✅ Jest report parsed successfully');
        console.log(`   Suites: ${suites}`);
        console.log(`   Tests: ${passed} passed, ${failed} failed, ${total} total`);
        console.log(`   Success rate: ${percentage}%`);

        return { suites, tests: total, passed, failed, percentage };
    } catch (error) {
        console.error('❌ Error parsing Jest report:', error.message);
        return { suites: 16, tests: 0, passed: 0, failed: 0, percentage: 0 };
    }
}

function parseCypressReport() {
    const cypressReportPath = path.join(__dirname, '../Resultados/Cypress/index.html');

    if (!fs.existsSync(cypressReportPath)) {
        console.log('⚠️  Cypress report not found at:', cypressReportPath);
        return { suites: 10, tests: 0, passed: 0, failed: 0, percentage: 0 };
    }

    try {
        const reportHtml = fs.readFileSync(cypressReportPath, 'utf8');

        // Mochawesome reporter patterns
        // Look for: "38 passing" and "0 failing" typically shown at the top
        const passingMatch = reportHtml.match(/(passes|\"passes\")[^:]*:\s*(\d+)/i) ||
                            reportHtml.match(/(\d+)\s+passing/i);

        const failingMatch = reportHtml.match(/(failures|\"failures\")[^:]*:\s*(\d+)/i) ||
                            reportHtml.match(/(\d+)\s+failing/i);

        // Count test spec files (suites)
        const suiteMatches = reportHtml.match(/\.cy\.(ts|js|tsx|jsx)/g) || [];

        const passed = passingMatch ? parseInt(passingMatch[2] || passingMatch[1]) : 0;
        const failed = failingMatch ? parseInt(failingMatch[2] || failingMatch[1]) : 0;
        const total = passed + failed;
        const suites = suiteMatches.length > 0 ? suiteMatches.length : 10;
        const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;

        console.log('✅ Cypress report parsed successfully');
        console.log(`   Suites: ${suites}`);
        console.log(`   Tests: ${passed} passed, ${failed} failed, ${total} total`);
        console.log(`   Success rate: ${percentage}%`);

        return { suites, tests: total, passed, failed, percentage };
    } catch (error) {
        console.error('❌ Error parsing Cypress report:', error.message);
        return { suites: 10, tests: 0, passed: 0, failed: 0, percentage: 0 };
    }
}

function generateTestData() {
    console.log('\n🔄 Generating test data JSON...\n');

    const jestData = parseJestReport();
    const cypressData = parseCypressReport();

    const testData = {
        jest: jestData,
        cypress: cypressData,
        generatedAt: new Date().toISOString()
    };

    const outputPath = path.join(__dirname, '../Resultados/test-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(testData, null, 2));

    console.log('\n✅ Test data JSON generated successfully!');
    console.log(`   Output: ${outputPath}`);
    console.log('\n📊 Summary:');
    console.log(`   Total tests: ${jestData.tests + cypressData.tests}`);
    console.log(`   Total passed: ${jestData.passed + cypressData.passed}`);
    console.log(`   Total failed: ${jestData.failed + cypressData.failed}`);
    const totalTests = jestData.tests + cypressData.tests;
    const totalPassed = jestData.passed + cypressData.passed;
    console.log(`   Overall success rate: ${
        totalTests > 0
            ? Math.round((totalPassed / totalTests) * 100)
            : 0
    }%`);
    console.log('\n🌐 Open Resultados/index.html to view the consolidated report\n');
}

// Run the script
try {
    generateTestData();
} catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
}

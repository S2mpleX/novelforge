const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getGitHubToken() {
    try {
        const out = execSync('git credential fill', {
            input: 'protocol=https\nhost=github.com\n\n',
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'ignore']
        });
        const match = out.match(/password=(.+)/);
        if (match && match[1]) {
            return match[1].trim();
        }
    } catch (e) {}

    const gcmCandidates = [
        'C:\\Program Files\\Git\\mingw64\\bin\\git-credential-manager.exe',
        'C:\\Program Files\\Git\\bin\\git-credential-manager.exe'
    ];
    for (const gcm of gcmCandidates) {
        if (fs.existsSync(gcm)) {
            try {
                const out = execSync(`"${gcm}" get`, {
                    input: 'protocol=https\nhost=github.com\n\n',
                    encoding: 'utf-8',
                    stdio: ['pipe', 'pipe', 'ignore']
                });
                const match = out.match(/password=(.+)/);
                if (match && match[1]) {
                    return match[1].trim();
                }
            } catch (e) {}
        }
    }
    return null;
}

async function main() {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'));
    const version = process.argv[2] || pkg.version;
    const tagName = `v${version}`;
    const owner = 'S2mpleX';
    const repo = 'novelforge';

    console.log(`\n🚀 开始发布 NovelForge AI v${version} 到 GitHub Release...`);

    const token = getGitHubToken();
    if (!token) {
        console.error('❌ 未能获取到 GitHub Token，请确保 Git 凭据管理器已登录 GitHub。');
        process.exit(1);
    }

    const desktopDir = `C:\\Users\\xiaoyong\\Desktop\\NovelForge-AI-v${version}`;
    if (!fs.existsSync(desktopDir)) {
        console.error(`❌ 未找到发布目录: ${desktopDir}`);
        process.exit(1);
    }

    const files = fs.readdirSync(desktopDir);
    const exeFile = files.find(f => f.startsWith('NovelForge') && f.endsWith('.exe'));
    if (!exeFile) {
        console.error(`❌ 未在 ${desktopDir} 找到 .exe 安装包文件`);
        process.exit(1);
    }

    const sigFile = `${exeFile}.sig`;
    const latestJsonFile = 'latest.json';

    // GitHub 会将文件名中的空格替换为点号
    const ghExeName = exeFile.replace(/\s+/g, '.');
    const ghSigName = `${ghExeName}.sig`;

    const latestJsonPath = path.join(desktopDir, latestJsonFile);
    if (fs.existsSync(latestJsonPath)) {
        try {
            const latestMeta = JSON.parse(fs.readFileSync(latestJsonPath, 'utf-8'));
            if (latestMeta.platforms && latestMeta.platforms['windows-x86_64']) {
                latestMeta.platforms['windows-x86_64'].url = `https://github.com/${owner}/${repo}/releases/download/${tagName}/${ghExeName}`;
                fs.writeFileSync(latestJsonPath, JSON.stringify(latestMeta, null, 2), 'utf-8');
            }
        } catch (e) {
            console.warn('⚠️ 规范化 latest.json 链接时遇到轻微异常:', e.message);
        }
    }

    const requiredFiles = [
        { name: latestJsonFile, ghName: latestJsonFile, type: 'application/json' },
        { name: sigFile, ghName: ghSigName, type: 'text/plain' },
        { name: exeFile, ghName: ghExeName, type: 'application/octet-stream' }
    ];

    const headers = {
        'Authorization': `token ${token}`,
        'User-Agent': 'NovelForge-Deploy',
        'Accept': 'application/vnd.github.v3+json'
    };

    console.log(`🔍 检查远端 Release ${tagName} 状态...`);
    let release = null;
    const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/tags/${tagName}`, { headers });

    if (getRes.ok) {
        release = await getRes.json();
        console.log(`ℹ️ 发现已存在 Release ${tagName} (ID: ${release.id})`);
    } else if (getRes.status === 404) {
        console.log(`🌱 正在创建 Release ${tagName} ...`);
        const bodyContent = `## NovelForge AI v${version} 正式发布

请通过应用内自动更新或下载随附安装包升级。详细变更请参阅 CHANGELOG.md。`;

        const createRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tag_name: tagName,
                target_commitish: 'main',
                name: `NovelForge AI v${version}`,
                body: bodyContent,
                draft: false,
                prerelease: false
            })
        });

        if (!createRes.ok) {
            const errText = await createRes.text();
            console.error(`❌ 创建 Release 失败: ${createRes.status} ${errText}`);
            process.exit(1);
        }
        release = await createRes.json();
        console.log(`✅ Release ${tagName} 创建成功！(ID: ${release.id})`);
    } else {
        const errText = await getRes.text();
        console.error(`❌ 获取 Release 失败: ${getRes.status} ${errText}`);
        process.exit(1);
    }

    const releaseId = release.id;
    const existingAssets = release.assets || [];

    for (let i = 0; i < requiredFiles.length; i++) {
        const item = requiredFiles[i];
        const filePath = path.join(desktopDir, item.name);
        const stats = fs.statSync(filePath);
        const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

        // 如果远端已存在该 asset，则先删除以便覆盖
        const matched = existingAssets.find(a => a.name === item.ghName || a.name === item.name);
        if (matched) {
            console.log(`🗑️ 发现已有 asset: ${matched.name} (ID: ${matched.id})，正在删除重传...`);
            await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/assets/${matched.id}`, {
                method: 'DELETE',
                headers
            });
        }

        console.log(`⏳ [${i + 1}/${requiredFiles.length}] 正在上传 ${item.ghName} (${sizeMb} MB)...`);
        const fileBuffer = fs.readFileSync(filePath);
        const uploadUrl = `https://uploads.github.com/repos/${owner}/${repo}/releases/${releaseId}/assets?name=${encodeURIComponent(item.ghName)}`;

        const uploadRes = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                ...headers,
                'Content-Type': item.type,
                'Content-Length': fileBuffer.length.toString()
            },
            body: fileBuffer
        });

        if (!uploadRes.ok) {
            const errText = await uploadRes.text();
            console.error(`❌ 上传 ${item.ghName} 失败: ${uploadRes.status} ${errText}`);
            process.exit(1);
        }

        const uploadedAsset = await uploadRes.json();
        console.log(`✅ [${i + 1}/${requiredFiles.length}] ${item.ghName} 上传成功！(Asset ID: ${uploadedAsset.id})`);
    }

    console.log(`\n🎉 发布完成！`);
    console.log(`🌐 Release 地址: ${release.html_url}`);
    console.log(`📥 客户端最新清单地址: https://github.com/${owner}/${repo}/releases/latest/download/latest.json\n`);
}

main().catch(err => {
    console.error('❌ 执行异常:', err);
    process.exit(1);
});

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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getLiveAssets(owner, repo, releaseId, headers) {
    try {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/${releaseId}/assets`, { headers });
        if (res.ok) {
            return await res.json();
        }
    } catch (e) {}
    return [];
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
    const sigPath = path.join(desktopDir, sigFile);
    const sigContent = fs.existsSync(sigPath) ? fs.readFileSync(sigPath, 'utf-8').trim() : '';

    const releaseNotes = `## NovelForge AI v${version} 正式发布

### 核心亮点
- **沉浸写作 Zen 模式 vs 专业工坊 Studio 模式**：顶栏一键秒级双态流转，独占宣纸居中打字画布与案头极简磨砂浮岛，按键 F11 / Ctrl+Alt+Z 随时切换。
- **作家案头灵感工作台 (WritersDeskModal)** 与 **拆书复盘引擎 (DeconstructModal)** 体验全面跃升。
- **世界观地图交互引擎 (MapModal)** 标注能力与拓扑渲染增强。
- **故事大纲剧情弧面板 (PlotOutlinePanel)** 与 **资产提案系统 (AssetProposalEngine)** 联动优化。

请通过应用内自动更新或下载随附安装包升级。`;

    if (!fs.existsSync(latestJsonPath) && sigContent) {
        const latestMeta = {
            version: version,
            notes: releaseNotes,
            pub_date: new Date().toISOString(),
            platforms: {
                'windows-x86_64': {
                    signature: sigContent,
                    url: `https://github.com/${owner}/${repo}/releases/download/${tagName}/${ghExeName}`
                }
            }
        };
        fs.writeFileSync(latestJsonPath, JSON.stringify(latestMeta, null, 2), 'utf-8');
        console.log(`📝 已自动生成 updater 清单: ${latestJsonFile}`);
    } else if (fs.existsSync(latestJsonPath)) {
        try {
            const latestMeta = JSON.parse(fs.readFileSync(latestJsonPath, 'utf-8'));
            if (!latestMeta.platforms) latestMeta.platforms = {};
            if (!latestMeta.platforms['windows-x86_64']) latestMeta.platforms['windows-x86_64'] = {};
            latestMeta.platforms['windows-x86_64'].url = `https://github.com/${owner}/${repo}/releases/download/${tagName}/${ghExeName}`;
            if (sigContent) {
                latestMeta.platforms['windows-x86_64'].signature = sigContent;
            }
            if (!latestMeta.version) latestMeta.version = version;
            if (!latestMeta.pub_date) latestMeta.pub_date = new Date().toISOString();
            fs.writeFileSync(latestJsonPath, JSON.stringify(latestMeta, null, 2), 'utf-8');
            console.log(`📝 已同步规范化 updater 清单: ${latestJsonFile}`);
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

        // 同步更新 Release 说明为详尽内容
        try {
            await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/${release.id}`, {
                method: 'PATCH',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `NovelForge AI v${version}`,
                    body: releaseNotes
                })
            });
        } catch (e) {}
    } else if (getRes.status === 404) {
        console.log(`🌱 正在创建 Release ${tagName} ...`);
        const createRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tag_name: tagName,
                target_commitish: 'main',
                name: `NovelForge AI v${version}`,
                body: releaseNotes,
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

    for (let i = 0; i < requiredFiles.length; i++) {
        const item = requiredFiles[i];
        const filePath = path.join(desktopDir, item.name);
        if (!fs.existsSync(filePath)) {
            console.error(`❌ 本地缺失必要发布资产: ${filePath}`);
            process.exit(1);
        }
        const stats = fs.statSync(filePath);
        const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

        // 实时查询远端最新资产状态
        let liveAssets = await getLiveAssets(owner, repo, releaseId, headers);
        let matched = liveAssets.find(a => a.name === item.ghName || a.name === item.name);

        if (matched) {
            // 如果大小完全一致且已成功上传，可直接复用避免重复耗时上传
            if (matched.size === stats.size && matched.state === 'uploaded') {
                console.log(`✅ [${i + 1}/${requiredFiles.length}] ${item.ghName} 远端已有且内容完整 (${sizeMb} MB, Asset ID: ${matched.id})，跳过重复上传。`);
                continue;
            }

            console.log(`🗑️ 发现已有 asset: ${matched.name} (ID: ${matched.id})，正在删除重传...`);
            await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/assets/${matched.id}`, {
                method: 'DELETE',
                headers
            });
            await sleep(1500); // 等待 GitHub 后端清理完成
        }

        console.log(`⏳ [${i + 1}/${requiredFiles.length}] 正在上传 ${item.ghName} (${sizeMb} MB)...`);
        const fileBuffer = fs.readFileSync(filePath);
        const uploadUrl = `https://uploads.github.com/repos/${owner}/${repo}/releases/${releaseId}/assets?name=${encodeURIComponent(item.ghName)}`;

        let uploadRes = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                ...headers,
                'Content-Type': item.type,
                'Content-Length': fileBuffer.length.toString()
            },
            body: fileBuffer
        });

        // 若仍遇到 422 冲突，执行一次重试清理
        if (uploadRes.status === 422) {
            console.warn(`⚠️ 上传遇到冲突，重新拉取资产列表并清理残留...`);
            liveAssets = await getLiveAssets(owner, repo, releaseId, headers);
            matched = liveAssets.find(a => a.name === item.ghName || a.name === item.name);
            if (matched) {
                await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/assets/${matched.id}`, {
                    method: 'DELETE',
                    headers
                });
                await sleep(2000);
            }
            uploadRes = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    ...headers,
                    'Content-Type': item.type,
                    'Content-Length': fileBuffer.length.toString()
                },
                body: fileBuffer
            });
        }

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

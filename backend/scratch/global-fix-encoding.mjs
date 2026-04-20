import fs from 'fs';
import path from 'path';

const replacements = {
    'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
    'Ã¢': 'â', 'Ãª': 'ê', 'Ã´': 'ô', 'Ã ': 'à', 'Ã£': 'ã',
    'Ãõ': 'õ', 'Ã§': 'ç', 'Ã ': 'Á', 'Ã‰': 'É', 'Ã ': 'Í',
    'Ã“': 'Ó', 'Ãš': 'Ú', 'Ã‚': 'Â', 'ÃŠ': 'Ê', 'Ã”': 'Ô',
    'Ã€': 'À', 'Ãƒ': 'Ã', 'Ã†': 'Æ', 'Ã‡': 'Ç',
    'âœ…': '✅', 'ðŸŽ‰': '🎉', 'ðŸ“§': '📧', 'ðŸ”‘': '🔑',
    'ðŸ‘¤': '👤', 'ðŸ›¡ï¸ ': '🛡️', 'ðŸ ¢': '🏢', 'ðŸ“¦': '📦',
    'ðŸ“ ': '📌', 'âœ“': '✔️', 'â Œ': '❌', 'ðŸŒ±': '🌱',
    'ðŸ§¹': '🧹', 'ðŸ†”': '🆔', 'ðŸŽ­': '🎭',
    'USUÃ RIO ADMINISTRADOR CRIADO': 'USUÁRIO ADMINISTRADOR CRIADO',
    'MÃ“DULO E PERMISSÃ•ES ATRIBUÃ DAS': 'MÓDULO E PERMISSÕES ATRIBUÍDAS',
    'DescriÃ§Ã£o': 'Descrição',
    'Atividades ObrigatÃ³rias': 'Atividades Obrigatórias',
    'â”': '━',
    'nÃ£o': 'não', 'NÃ£o': 'Não', 'possÃ­vel': 'possível', 'vÃ­nculos': 'vínculos', 'UsuÃ¡rio': 'Usuário'
};

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const targetDirs = [
    'c:/Users/lucas.silva/Documents/portal/Portal-Aurora/backend/src',
    'c:/Users/lucas.silva/Documents/portal/Portal-Aurora/aurora-eadi-front/src'
];

targetDirs.forEach(targetDir => {
    if (!fs.existsSync(targetDir)) return;
    walkDir(targetDir, (filePath) => {
        if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx') && !filePath.endsWith('.js')) return;
        
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        
        for (const [k, v] of Object.entries(replacements)) {
            content = content.split(k).join(v);
        }
        
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Fixed: ${filePath}`);
        }
    });
});

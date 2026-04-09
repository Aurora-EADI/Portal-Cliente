import fs from 'fs';

const path = 'c:/Users/lucas.silva/Documents/portal/Portal-Aurora/backend/prisma/postgres/seed.ts';
let content = fs.readFileSync(path, 'utf8');

const replacements = {
    'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
    'Ã¢': 'â', 'Ãª': 'ê', 'Ã´': 'ô', 'Ã ': 'à', 'Ã£': 'ã',
    'Ãõ': 'õ', 'Ã§': 'ç', 'Ã': 'Á', 'Ã‰': 'É', 'Ã': 'Í',
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
    'â”': '━'
};

for (const [k, v] of Object.entries(replacements)) {
    content = content.split(k).join(v);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed characters in seed.ts');

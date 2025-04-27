// onMemberJoin.js

module.exports = (client) => {
    const cargoInicialID = '1200929948202967100'; // ID do cargo que queremos adicionar

    client.on('guildMemberAdd', async (member) => {
        try {
            const cargo = member.guild.roles.cache.get(cargoInicialID);
            if (cargo) {
                await member.roles.add(cargo);
                console.log(`✅ Cargo inicial adicionado para ${member.user.tag}`);
            } else {
                console.log('❌ Cargo inicial não encontrado.');
            }
        } catch (error) {
            console.error(`Erro ao adicionar cargo inicial para ${member.user.tag}:`, error);
        }
    });
};

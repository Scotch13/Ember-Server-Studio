/* Local, side-effect-free console completion. No RCON or unsolicited commands. */
((root)=>{
  const commands={
    advancement:'<grant|revoke> <targets> <everything|only|from|through|until>',
    attribute:'<target> <attribute> <get|base|modifier>',ban:'<targets> [reason]',
    'ban-ip':'<target> [reason]',banlist:'[ips|players]',bossbar:'<add|get|list|remove|set>',
    clear:'[targets] [item] [maxCount]',clone:'<begin> <end> <destination>',
    damage:'<target> <amount> [damageType]',data:'<get|merge|modify|remove>',
    datapack:'<disable|enable|list>',deop:'<targets>',difficulty:'<peaceful|easy|normal|hard>',
    effect:'<clear|give> <targets> [effect]',enchant:'<targets> <enchantment> [level]',
    execute:'<as|at|in|if|unless|run> ...',experience:'<add|set|query> <targets> ...',
    fill:'<from> <to> <block>',forceload:'<add|remove|query>',function:'<name>',
    gamemode:'<survival|creative|adventure|spectator> [targets]',gamerule:'<rule> [value]',
    give:'<targets> <item> [count]',help:'[command]',kick:'<targets> [reason]',kill:'<targets>',
    list:'[uuids]',locate:'<structure|biome|poi> <id>',me:'<message>',msg:'<targets> <message>',
    op:'<targets>',pardon:'<targets>','pardon-ip':'<target>',particle:'<name> ...',
    perf:'<start|stop>',place:'<feature|jigsaw|structure|template>',playsound:'<sound> <source> <targets>',
    random:'<value|roll|reset>',
    reload:'',return:'<value>',ride:'<target> <mount|dismount>',
    'save-all':'[flush]','save-off':'','save-on':'',say:'<message>',
    schedule:'<function|clear> ...',scoreboard:'<objectives|players> ...',seed:'',
    setblock:'<pos> <block> [destroy|keep|replace]',setworldspawn:'[pos] [angle]',
    spawnpoint:'[targets] [pos] [angle]',spectate:'[target] [player]',spreadplayers:'<center> <spreadDistance> <maxRange> <respectTeams> <targets>',
    stop:'',stopsound:'<targets> [source] [sound]',summon:'<entity> [pos] [nbt]',
    tag:'<targets> <add|remove|list>',team:'<add|empty|join|leave|list|modify|remove>',
    teammsg:'<message>',teleport:'<targets> <destination>',tell:'<targets> <message>',
    tellraw:'<targets> <message>',tick:'<query|rate|freeze|unfreeze|step|sprint>',
    time:'<set|add|query> <value>',title:'<targets> <clear|reset|title|subtitle|actionbar|times>',
    tp:'<targets> <destination>',transfer:'<hostname> [port] [players]',
    trigger:'<objective> [add|set] [value]',weather:'<clear|rain|thunder> [duration]',
    whitelist:'<add|remove|list|on|off|reload> [targets]',worldborder:'<add|center|damage|get|set|warning>',
    xp:'<add|set|query> <targets> ...'
  };
  const rules=['announceAdvancements','commandBlockOutput','disableRaids','doDaylightCycle','doEntityDrops','doFireTick','doInsomnia','doImmediateRespawn','doLimitedCrafting','doMobLoot','doMobSpawning','doPatrolSpawning','doTileDrops','doTraderSpawning','doVinesSpread','doWardenSpawning','doWeatherCycle','drowningDamage','fallDamage','fireDamage','forgiveDeadPlayers','freezeDamage','keepInventory','logAdminCommands','mobGriefing','naturalRegeneration','playersSleepingPercentage','randomTickSpeed','reducedDebugInfo','sendCommandFeedback','showDeathMessages','spawnRadius','spectatorsGenerateChunks','universalAnger'];
  const numericRules=new Set(['playersSleepingPercentage','randomTickSpeed','spawnRadius']);
  // Java 1.21.11+ moved gamerules into a namespaced snake_case registry.
  const modernRules=['advance_time','advance_weather','block_drops','block_explosion_drop_decay','command_block_output','command_blocks_work','drowning_damage','elytra_movement_check','ender_pearls_vanish_on_death','entity_drops','fall_damage','fire_damage','fire_spread_radius_around_player','forgive_dead_players','freeze_damage','global_sound_events','immediate_respawn','keep_inventory','lava_source_conversion','limited_crafting','locator_bar','log_admin_commands','max_block_modifications','max_command_forks','max_command_sequence_length','max_entity_cramming','max_minecart_speed','max_snow_accumulation_height','mob_drops','mob_explosion_drop_decay','mob_griefing','natural_health_regeneration','player_movement_check','players_nether_portal_creative_delay','players_nether_portal_default_delay','players_sleeping_percentage','projectiles_can_break_blocks','pvp','raids','random_tick_speed','reduced_debug_info','respawn_radius','send_command_feedback','show_advancement_messages','show_death_messages','spawn_mobs','spawn_monsters','spawn_patrols','spawn_phantoms','spawn_wandering_traders','spawn_wardens','spawner_blocks_work','spectators_generate_chunks','spread_vines','tnt_explodes','tnt_explosion_drop_decay','universal_anger','water_source_conversion'];
  const modernNumeric=new Set(['fire_spread_radius_around_player','max_block_modifications','max_command_forks','max_command_sequence_length','max_entity_cramming','max_minecart_speed','max_snow_accumulation_height','players_nether_portal_creative_delay','players_nether_portal_default_delay','players_sleeping_percentage','random_tick_speed','respawn_radius']);
  const itemIds=['air','stone','cobblestone','dirt','grass_block','oak_log','oak_planks','glass','sand','diamond','diamond_block','diamond_sword','diamond_pickaxe','diamond_axe','diamond_helmet','diamond_chestplate','diamond_leggings','diamond_boots','netherite_ingot','netherite_sword','netherite_pickaxe','iron_ingot','gold_ingot','emerald','redstone','coal','torch','chest','crafting_table','furnace','bread','cooked_beef','golden_apple','enchanted_golden_apple','elytra','firework_rocket','totem_of_undying','water_bucket','command_block','barrier','structure_block'];
  const entityIds=['allay','armor_stand','bat','bee','blaze','camel','cat','chicken','cow','creeper','dolphin','dragon_fireball','enderman','ender_dragon','fox','frog','ghast','horse','iron_golem','item','lightning_bolt','llama','magma_cube','mooshroom','ocelot','panda','parrot','phantom','pig','piglin','pillager','rabbit','sheep','shulker','silverfish','skeleton','slime','snow_golem','spider','squid','tnt','turtle','vex','villager','vindicator','wandering_trader','warden','witch','wither','wither_skeleton','wolf','zombie','zombie_villager'];
  const effects=['absorption','bad_omen','blindness','darkness','fire_resistance','glowing','haste','health_boost','hero_of_the_village','hunger','instant_damage','instant_health','invisibility','jump_boost','levitation','mining_fatigue','nausea','night_vision','poison','regeneration','resistance','saturation','slow_falling','slowness','speed','strength','unluck','water_breathing','weakness','wither'];
  const branches={advancement:['grant','revoke'],banlist:['ips','players'],bossbar:['add','get','list','remove','set'],data:['get','merge','modify','remove'],datapack:['disable','enable','list'],difficulty:['peaceful','easy','normal','hard'],effect:['clear','give'],execute:['as','at','in','if','unless','run','positioned','rotated','facing','align','anchored','store'],experience:['add','set','query'],forceload:['add','remove','query'],gamemode:['survival','creative','adventure','spectator'],locate:['structure','biome','poi'],perf:['start','stop'],place:['feature','jigsaw','structure','template'],random:['value','roll','reset'],schedule:['function','clear'],scoreboard:['objectives','players'],team:['add','empty','join','leave','list','modify','remove'],tick:['query','rate','freeze','unfreeze','step','sprint'],time:['set','add','query'],weather:['clear','rain','thunder'],whitelist:['add','remove','list','on','off','reload'],worldborder:['add','center','damage','get','set','warning']};
  const playerFirst=new Set(['advancement','attribute','ban','clear','damage','deop','enchant','give','kick','kill','msg','op','pardon','ride','spawnpoint','spectate','stopsound','tag','teleport','tell','tellraw','title','tp']);
  function suggest(value,caret=value.length,context={}){
    if(typeof value!=='string'||value.length>2000||/[\r\n\x00]/.test(value))return {items:[]};
    caret=Math.max(0,Math.min(value.length,caret));
    let start=caret,end=caret;while(start>0&&!/\s/.test(value[start-1]))start--;while(end<value.length&&!/\s/.test(value[end]))end++;
    const before=value.slice(0,start).trim(),tokens=before.split(/\s+/).filter(Boolean),prefix=value.slice(start,caret),rootToken=!tokens.length;
    if(/["'{}\[\]]/.test(before+prefix))return {items:[]};
    const command=(tokens[0]||'').replace(/^\//,'').replace(/^minecraft:/,''),arg=tokens.length;
    const version=String(context.version||'').match(/^(\d+)\.(\d+)(?:\.(\d+))?/),parts=version?.slice(1).map(n=>Number(n)||0);
    const modern=parts&&(parts[0]>=26||parts[0]===1&&(parts[1]>21||parts[1]===21&&parts[2]>=11));
    const gameRules=modern?modernRules:rules,numberRules=modern?modernNumeric:numericRules;
    const ids=values=>values.map(id=>(prefix.startsWith('minecraft:')?'minecraft:':'')+id);
    let candidates=[],kind='Argomento',usage='';
    const players=()=>[...new Set((context.players||[]).filter(name=>typeof name==='string'&&/^[A-Za-z0-9_]{1,16}$/.test(name)))];
    const targets=()=>['@a','@e','@p','@r','@s',...players()];
    if(rootToken){
      kind='Comando Minecraft';const names={...commands};
      if(parts){for(const [name,minor,patch]of [['attribute',16,0],['damage',19,4],['ride',19,4],['random',20,2],['return',20,2],['tick',20,3],['transfer',20,5]])if(parts[0]===1&&(parts[1]<minor||parts[1]===minor&&parts[2]<patch))delete names[name];}
      if(['paper','purpur'].includes(context.type))Object.assign(names,{plugins:'',version:'[plugin]',tps:'',timings:'<on|off|paste|reset>',paper:'<version|chunkinfo|heap|...>',bukkit:'<help|version|plugins>'});
      let lead=prefix.startsWith('/')?'/':'';const plain=prefix.slice(lead.length);if(plain.startsWith('minecraft:'))lead+='minecraft:';
      candidates=Object.keys(names).map(name=>({value:lead+name,usage:name+(names[name]?' '+names[name]:''),kind}));
    }else{
      usage=command+(commands[command]?' '+commands[command]:'');
      if(arg===1){
        if(command==='help'){candidates=Object.keys(commands);kind='Comando Minecraft';}
        else if(command==='gamerule'){candidates=modern?ids(gameRules):gameRules;kind='Regola di gioco';}
        else if(command==='summon'){candidates=ids(entityIds);kind='Entità';}
        else if(branches[command])candidates=branches[command];
        else if(playerFirst.has(command)){candidates=['ban','deop','op','pardon'].includes(command)?players():targets();kind='Giocatore o selettore';}
      }else if(arg===2){
        if(['gamemode','effect','experience','xp'].includes(command)||command==='whitelist'&&['add','remove'].includes(tokens[1])){candidates=command==='whitelist'?players():targets();kind='Giocatore o selettore';}
        else if(['tp','teleport'].includes(command)){candidates=targets();kind='Giocatore o selettore';}
        else if(command==='gamerule'&&gameRules.includes(tokens[1].replace(/^minecraft:/,''))&&!numberRules.has(tokens[1].replace(/^minecraft:/,'')))candidates=['true','false'];
        else if(command==='give'){candidates=ids(itemIds);kind='Oggetto';}
        else if(command==='time')candidates=tokens[1]==='set'?['day','noon','night','midnight']:tokens[1]==='query'?['daytime','gametime','day']:[];
        else if(command==='datapack'&&tokens[1]==='list')candidates=['available','enabled'];
        else if(command==='execute'&&tokens[1]==='in')candidates=['minecraft:overworld','minecraft:the_nether','minecraft:the_end'];
        else if(command==='execute'&&['as','at'].includes(tokens[1])){candidates=targets();kind='Giocatore o selettore';}
        else if(command==='tag')candidates=['add','remove','list'];
        else if(command==='title')candidates=['clear','reset','title','subtitle','actionbar','times'];
        else if(command==='ride')candidates=['mount','dismount'];
        else if(command==='scoreboard')candidates=tokens[1]==='objectives'?['add','list','modify','remove','setdisplay']:tokens[1]==='players'?['add','enable','get','list','operation','remove','reset','set']:[];
        else if(command==='worldborder')candidates=tokens[1]==='damage'?['amount','buffer']:tokens[1]==='warning'?['distance','time']:[];
      }else if(arg===3&&command==='effect'&&tokens[1]==='give'){candidates=ids(effects);kind='Effetto';}
      candidates=candidates.map(value=>({value,kind,usage}));
    }
    return {start,end,items:candidates.filter(item=>item.value.toLowerCase().startsWith(prefix.toLowerCase())).slice(0,80)};
  }
  function complete(value,result,index=0){
    const item=result.items[index];if(!item)return null;
    const suffix=value.slice(result.end),insert=item.value+(!suffix||!/^\s/.test(suffix)?' ':'');
    return {value:value.slice(0,result.start)+insert+suffix,caret:result.start+insert.length};
  }
  const api={suggest,complete};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.EmberCommandData=api;
})(globalThis);

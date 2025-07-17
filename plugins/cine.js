const axios = require('axios');
const config = require('../settings')
const { cmd, commands } = require('../lib/command')
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('../lib/functions')
const fg = require('api-dylux');

const oce = "`"
const oce3 = "```"
const oce2 = '*'
const pk = "`("
const pk2 = ")`"

const baseUrl = "https://my-api-8v32.vercel.app//";
const apiKey = "";
// ============================= L A N G U A G E =============================
const errorReact = "❌";

var errorMg, notFoundMg, sendMg, mvMg;

if (config.LANG === 'SI') {
    errorMg = '*දෝශයක් ඇති විය, කරුණාකර පසුව උත්සාහ කරන්න ❌*';
    notFoundMg = '*මට කිසිවක් සොයාගත නොහැකි විය 📛*';
    sendMg = '*ගොනුව සාර්ථකව යවන ලදී ✅*';
    mvMg = '*කරුණාකර මට චිත්‍රපටයේ නම දෙන්න ❓*';
} else if (config.LANG === 'TA') {
    errorMg = '*ஒரு பிழை ஏற்பட்டது, பின்னர் முயற்சிக்கவும் ❌*';
    notFoundMg = '*என்னால் எதையும் கண்டுபிடிக்க முடியவில்லை 📛*';
    sendMg = '*கோப்பு வெற்றிகரமாக அனுப்பப்பட்டது ✅*';
    mvMg = '*தயவுசெய்து எனக்கு திரைப்படத்தின் பெயரை கூறுங்கள் ❓*';
} else if (config.LANG === 'HI') {
    errorMg = '*एक त्रुटि उत्पन्न हुई, कृपया बाद में पुनः प्रयास करें ❌*';
    notFoundMg = '*मुझे कुछ भी नहीं मिला 📛*';
    sendMg = '*फ़ाइल सफलतापूर्वक भेजी गई ✅*';
    mvMg = '*कृपया मुझे फिल्म का नाम दें ❓*';
} else {
    errorMg = '*An error occurred, please try again later ❌*';
    notFoundMg = '*I couldn\'t find anything. 📛*';
    sendMg = '*File sent successfully ✅*';
    mvMg = '*Please give me the movie name ❓*';
}


//=====================================================================================================================
function formatNumber(num) {
    return String(num).padStart(2, '0');
}

async function uploadFile(url, type, from, jid, nmf, quality, mek, conn) {
    try {
        const up_mg = await conn.sendMessage(from, { text: 'Uploading Your Request Video..⬆' }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '⬆', key: mek.key } });

        if(url.includes("https://drive.usercontent.google.com/")) url = url.replace("https://drive.usercontent.google.com/", "https://drive.google.com/")

        let bufferdata, mime, fileName;
        if (type === "gdrive") {
            let res = await fg.GDriveDl(url);
            bufferdata = { url: res.downloadUrl };
            mime = res.mimetype;
            fileName = `${nmf || res.fileName}.${mime.includes("mkv") ? "mkv" : "mp4"}`;
        } else if (type === "direct") {
            bufferdata = await getBuffer(url);
            const fileType = await import('file-type');
            const fileData = await fileType.fromBuffer(bufferdata);
            mime = fileData ? fileData.mime : 'video/mp4';
            fileName = `${nmf}.${mime.split('/')[1]}`;
        } else {
            throw new Error("Invalid download type");
        }

        var quoted = mek
        if(from !== jid) quoted = false

        await conn.sendMessage(jid, {
            document: bufferdata,
            fileName,
            mimetype: mime,
            caption: `${nmf}\n\`${quality}\`\n\n> ${config.FOOTER}`
        }, { quoted });

        await conn.sendMessage(from, { react: { text: '✔️', key: mek.key } });
        await conn.sendMessage(from, { delete: up_mg.key });
        if(jid !== from){
        await conn.sendMessage(from, { text: sendMg }, { quoted: mek })
        }
      
    } catch (error) {
        console.log(error)
        const em = await conn.sendMessage(from, { text: errorMg }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '❌', key: em.key } });
    }
}

//===============================================================================================================================


cmd({
    pattern: "cinesubzt",
    alias: ["mv","cine"],
    react: "🎥",
    desc: "Download movie for cinesubz.lk",
    category: "download",
    use: 'cinesubz < Movie Name >',
    filename: __filename
},
async (conn, m, mek, { from, q, reply, creator, backup, msr }) => {
    try {
        if (!q) return await reply(mvMg);

        const cineSearch = await fetchJson(`${baseUrl}/api/movie/cinesubz/search?q=${q}&apikey=${apiKey}`);
      
        if (!cineSearch.data) {
            const error = await conn.sendMessage(from, { text: notFoundMg }, { quoted: mek })
            await conn.sendMessage(from, { react: { text: errorReact, key: error.key } });
            return
        }


        const cineRes = cineSearch.data?.movies || [];

        if (cineRes.length === 0) {
            return await reply(`No results found for: ${q}`);
        }

        let info = `🎥 *𝖸𝖠𝖲𝖨𝖸𝖠-𝖬𝖣 𝖬𝖮𝖵𝖨𝖤 𝖲𝖤𝖠𝖱𝖢𝖧 𝖲𝖸𝖲𝖳𝖤𝖬* 🎥\n\n`;

        info += `*🔍 Search Results For:* ${q}\n\n`;
        cineRes.forEach((result, index) => {
            info += `*${formatNumber(index + 1)} ||* ${result.title.replace(/Sinhala Subtitles \| සිංහල උපසිරැසි සමඟ/g , '').replace('Sinhala Subtitle | සිංහල උපසිරැසි සමඟ' , '')}\n`;
        });

        info += `\n> ${config.FOOTER}`
        const sentMsg = await conn.sendMessage(from, { image: { url: config.LOGO }, text: info }, { quoted: mek });
        const messageID = sentMsg.key.id;
        await conn.sendMessage(from, { react: { text: '🎥', key: sentMsg.key } });

        conn.ev.on('messages.upsert', async (messageUpdate) => {
            const mekInfo = messageUpdate?.messages[0];
            if (!mek.message) return;
            const messageType = mekInfo?.message?.conversation || mekInfo?.message?.extendedTextMessage?.text;
            const from = mekInfo?.key?.remoteJid;

            const isReplyToSentMsg = mekInfo?.message?.extendedTextMessage?.contextInfo?.stanzaId === messageID;
            if (isReplyToSentMsg) {
                   try{
                let selectedEpIndex = parseInt(messageType.trim()) - 1;

                       // S E L E C T - O P T I O N
                if (selectedEpIndex >= 0 && selectedEpIndex < cineRes.length) {
                    const selectedMovie = cineRes[selectedEpIndex];
                    await conn.sendMessage(from, { react: { text: '🎥', key: mekInfo.key } });
                    const cineMovie = await fetchJson(`${baseUrl}/api/movie/cinesubz/movie?url=${selectedMovie.link}&apikey=${apiKey}`);
                    if (!cineMovie.data) {
                    const error = await conn.sendMessage(from, { text: notFoundMg }, { quoted: mek })
                    await conn.sendMessage(from, { react: { text: errorReact, key: error.key } });
                    return
                    }
                  
                    const movieData = cineMovie.data;

                    let optionsMsg = `🎬 *𝖸𝖠𝖲𝖨𝖸𝖠-𝖬𝖣 MOVIE DOWNLOAD SYSTEM* 🎬\n\n`;
                    optionsMsg += `${oce2}▫ 🎞️ Title:${oce2} ${movieData.title || 'N/A'}\n`;
                    optionsMsg += `${oce2}▫ 📅 Release Date:${oce2} ${movieData.date || 'N/A'}\n`;
                    optionsMsg += `${oce2}▫ 🌍 Country:${oce2} ${movieData.country || 'N/A'}\n`;
                    optionsMsg += `${oce2}▫ ⏱ Duration:${oce2} ${movieData.duration || 'N/A'}\n`;
                    optionsMsg += `${oce2}▫ 🖇️ Movie Link:${oce2} ${selectedMovie.link}\n`;
                    optionsMsg += `${oce2}▫ 🎀 Categories:${oce2} ${movieData.category || 'N/A'}\n`;
                    optionsMsg += `${oce2}▫ 🤵 Director:${oce2} ${movieData.director || 'N/A'}\n\n`;
                    optionsMsg += `▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃\n\n`

                    optionsMsg += `*${formatNumber(1)} ||* Details Card\n*${formatNumber(2)} ||* Send Images\n\n`;
                    movieData.downloadUrl.forEach((movie, index) => {
                        optionsMsg += `*${formatNumber(index + 3)} ||* ${movie.quality} [ ${movie.size} ]\n`;
                    });

                    optionsMsg += `\n\n> ${config.FOOTER}`
                    
                    const optMsg = await conn.sendMessage(from, { text: optionsMsg }, { quoted: mekInfo });
                    const optionsMessageID = optMsg.key.id;

                    conn.ev.on('messages.upsert', async (optionUpdate) => {
                        const mekOpt = optionUpdate.messages[0];
                        if (!mekOpt.message) return;
                        const optMessageType = mekOpt.message.conversation || mekOpt.message.extendedTextMessage?.text;
                        const fromOpt = mekOpt.key.remoteJid;

                        const isReplyToOptionsMsg = mekOpt?.message?.extendedTextMessage?.contextInfo?.stanzaId === optionsMessageID;
                        if (isReplyToOptionsMsg) {

                            let parts = optMessageType.trim().split(" ");
                            let optSelected = parts[0]; // First part (command or option)
                            let jid = parts.length > 1 ? parts[1].trim() : ""; // Second part (JID) if available

                            // Validate and correct JID format
                            if (!jid || (!jid.endsWith("@s.whatsapp.net") && !jid.endsWith("@g.us"))) {
                                jid = fromOpt; // Default to fromOpt if JID is invalid
                            }

                            // Attempt to extract quality option safely
                            let selectedQuality = isNaN(parseInt(optSelected)) ? -1 : parseInt(optSelected) - 3;


                            // S E N D - D E T A I L S
                            if (optSelected === "1") {
                                    try{
                                        
                                await conn.sendMessage(fromOpt, { react: { text: '🎥', key: mekOpt.key } });

                                let movImg = movieData.mainImage.replace("fit=", "fit") || movieData.images[0] || movieData.image || config.LOGO
                                let cast = (movieData.cast || []).map(i => i.actor.name || i.name).join(', ');

                                const mvInfo = `🍟 _*${movieData.title || 'N/A'}*_\n\n` +
                                               `🧿 ${oce}Release Date:${oce} ➜ ${movieData.dateCreate || 'N/A'}\n\n` +
                                               `🌍 ${oce}Country:${oce} ➜ ${movieData.country || 'N/A'}\n\n` +
                                               `⏱️ ${oce}Duration:${oce} ➜ ${movieData.duration || 'N/A'}\n\n` +
                                               `🎀 ${oce}Categories:${oce} ➜ ${movieData.category || 'N/A'}\n\n` +
                                               `⭐ ${oce}IMDB:${oce} ➜ ${movieData.imdb.value || 'N/A'}\n\n` +
                                               `🤵‍♂️ ${oce}Director:${oce} ➜ ${movieData.director.name || 'N/A'}\n\n` +
                                               `🕵️‍♂️ ${oce}Cast:${oce} ➜ ${cast || 'N/A'}\n\n` +
                                               `▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃\n\n` +
                                               `   💃 *Follow us ➢* https://whatsapp.com/channel/0029VaaPfFK7Noa8nI8zGg27\n\n` +
                                               `${config.FOOTER}`;

                                await conn.sendMessage(jid, {
                                    image: { url: movImg || config.LOGO },
                                    caption: mvInfo
                                });

                                    await conn.sendMessage(fromOpt, { react: { text: '✔️', key: mekOpt.key } });
                                    if(jid !== fromOpt){
                                        await conn.sendMessage(fromOpt, { text: sendMg }, { quoted: mek })
                                    }
                                    
                                    } catch (e) {
                                        console.log(e)
                                        const em = await conn.sendMessage(from, { text: errorMg }, { quoted: mek });
                                        await conn.sendMessage(from, { react: { text: '❌', key: em.key } });
                               }

                            // S E N D - I M A G E S
                            } else if (optSelected === "2") {
                                   try{
                                await conn.sendMessage(fromOpt, { react: { text: '⬇️', key: mekOpt.key } });

                                const images = movieData.images || [];
                                for (let img of images) {
                                    await conn.sendMessage(jid, { image: { url: img } });
                                }
                                    await conn.sendMessage(fromOpt, { react: { text: '✔️', key: mekOpt.key } });
                                   } catch (e) {       
                                    console.log(e)
                                    const em = await conn.sendMessage(from, { text: errorMg }, { quoted: mekOpt });
                                    await conn.sendMessage(from, { react: { text: '❌', key: em.key } });
                                 }
                                
                                // D O W N L O A D
                             } else if(selectedQuality >= 0 && selectedQuality < movieData.downloadUrl.length) {
                                
                                     const selectedQ = movieData.downloadUrl[selectedQuality];
                                     var size = selectedQ.size;
                            
                                try{

                                    await conn.sendMessage(fromOpt, { react: { text: '⬇', key: mekOpt.key } });

                                    size = parseFloat(size.replace('GB', '').replace('MB', ''));
                                    if (!isNaN(size)) {
                                    if (q.includes('GB') && size >= config.MAX_SIZE_GB) {
                                    return reply(`*The file is too large to download ⛔*\n\n` +
                                    `🔹 Your current *MAX_SIZE_GB* limit: *${config.MAX_SIZE_GB}GB* 📏\n` +
                                    `🔹 To change this limit, use the *${prefix}apply* command.`);
                                     }
                                    if (q.includes('MB') && size >= config.MAX_SIZE) {
                                    return reply(`*The file is too large to download ⛔*\n\n` +
                                    `🔹 Your current *MAX_SIZE* limit: *${config.MAX_SIZE}MB* 📏\n` +
                                    `🔹 To change this limit, use the *${prefix}apply* command.`);
                                    }}
                                    
                        
                                    const anu = await (await fetch(`${baseUrl}/api/movie/cinesubz/download?url=${selectedQ.link}&apikey=${apiKey}`)).json(); 

                                    if (!anu.data) {
                                    const error = await conn.sendMessage(from, { text: notFoundMg }, { quoted: mek })
                                    await conn.sendMessage(from, { react: { text: errorReact, key: error.key } });
                                    return
                                     }
                          
                                    if (anu.data.download.gdrive || anu.data.download.gdrive2) {
                                    await uploadFile(anu.data.download.gdrive || anu.data.download.gdrive2, "gdrive", fromOpt, jid, movieData.title, selectedQ.quality, mekOpt, conn);
                                    } else if (anu.response.direct) {
                                    await uploadFile(anu.data.download.direct, "direct", fromOpt, jid, movieData.title, selectedQ.quality, mekOpt, conn);
                                    } else if (anu.response.mega) {
                                    await uploadFile(anu.data.download.mega, "mega", fromOpt, jid, movieData.title, selectedQ.quality, mekOpt, conn);
                                    } else {
                                    await reply(notFoundMg);
                                    }
                        
                                } catch(e) {
                                        console.log(e)
                                        const em = await conn.sendMessage(from, { text: errorMg }, { quoted: mekOpt });
                                        await conn.sendMessage(from, { react: { text: '❌', key: em.key } });
                                }
                              
                            } else {
                                await reply(invalidReply);
                            }
                        }
                    });
                  } else {
                    await reply(invalidReply);
                }
                     
            } catch (e) {
                  console.log(e)
                  const em = await conn.sendMessage(from, { text: errorMg }, { quoted: mekInfo });
                  await conn.sendMessage(from, { react: { text: '❌', key: em.key } });
            }}
        });

    } catch (e) {
    console.log(e)
    const em = await conn.sendMessage(from, { text: errorMg }, { quoted: mek });
    await conn.sendMessage(from, { react: { text: '❌', key: em.key } });
    }
});

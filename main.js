const Nightmare = require('nightmare');
const fs = require('fs');
const config = require('config');
const nightmare = () => new Nightmare({
    show: true,
    waitTimeout: 500000000,
    openDevTools: {
        mode: 'detach'
    }
});

const username = config.get('username');

const password = config.get('password');

const LOGIN_URL = 'https://mp.weixin.qq.com/';

// 获取数据列表
export const preFetch = async () => {
    await nightmare().goto(LOGIN_URL)
        .viewport(1280, 900)
        .type('input[name="account"]', username)
        .type('input[name="password"]', password)
        .click('a.btn_login')
        .wait(() => document.querySelector('#menuBar'))
        .click('.menu_tmplmsg a')
        .wait(() => document.querySelector('#js_add_container'))
        .click('#topTab li[data-id="tmpllib"] a')
        .wait(() => {
            if (!document.querySelector('#js_search_panel')) {
                return false;
            }
            const pageNum = document.querySelectorAll('.page_num label');

            if (pageNum[0].innerText === '3') {
                return true;
            }

            if (pageNum[0].innerText === pageNum[1].innerText) {
                return true;
            }
            const tplMsgData = JSON.parse(localStorage.getItem('_tmplmsg_data_') || '[]') || [];
            document.querySelectorAll('#js_lib_container tbody tr')
                .forEach(item => {
                    const id = item.querySelector('.lib_tmplmsg_id').innerText;
                    const name = item.querySelector('.lib_tmplmsg_name').innerText;
                    tplMsgData.push({id, name});
                });
            localStorage.setItem('_tmplmsg_data_', JSON.stringify(tplMsgData));
            document.querySelector('a.page_next').click();
            return false;
        }).evaluate(() => localStorage.getItem('_tmplmsg_data_'))
        .end()
        .then(data => {
            const content = 'window.localDatalist = ' + data + ';';
            fs.writeFile(__dirname + `/output/data.js`, content, 'utf8', () => {
                console.log('write [data-list.json] success!');
            });

            fs.writeFile(__dirname + `/output/data.json`, data, 'utf8', () => {
                console.log('write [data-list.json] success!');
            });
        });
};


// 获取数据详情
const fetchData = async (list) => {
    await nightmare().goto(LOGIN_URL)
        .viewport(1280, 900)
        .type('input[name="account"]', username)
        .type('input[name="password"]', password)
        .click('a.btn_login')
        .wait(() => document.querySelector('#menuBar'))
        .click('.menu_tmplmsg a')
        .wait(() => document.querySelector('#js_add_container'))
        .click('#topTab li[data-id="tmpllib"] a')
        .inject('js', 'output/data.js')
        .wait(() => {
            if (!document.querySelector('#js_search_panel')) {
                return false;
            }
            const tplMsgIndex = 0;
            const token = location.href.split('&token=')[1].split('&')[0];
            const data = {
                tplMsgIndex,
                token,
                list: window.localDatalist
            };
            const item = window.localDatalist[0];
            localStorage.setItem('_tmplmsg_list_data_', JSON.stringify(data));
            location.href = `https://mp.weixin.qq.com/wxopen/tmplmsg?action=tmpl_select&store_tmpl_id=${item.id}&token=${token}&lang=zh_CN`;
            return true;
        })
        .wait(() => {
            if (!document.querySelector('.tmplmsg_card_hd')) {
                return false;
            }
            const tplMsgListData = JSON.parse(localStorage.getItem('_tmplmsg_list_data_'));
            const tplMsgIndex = tplMsgListData.tplMsgIndex;
            const item = tplMsgListData.list[tplMsgIndex];
            const token = tplMsgListData.token;
            item.list = wx.cgiData.detail.keyword_list;
            tplMsgListData.tplMsgIndex += 1;
            localStorage.setItem('_tmplmsg_list_data_', JSON.stringify(tplMsgListData));
            if (tplMsgIndex === tplMsgListData.list.length - 1) {
                return true;
            }
            location.href = `https://mp.weixin.qq.com/wxopen/tmplmsg?action=tmpl_select&store_tmpl_id=${item.id}&token=${token}&lang=zh_CN`;
            return false;
        })
        .evaluate(() => localStorage.getItem('_tmplmsg_list_data_'))
        .end()
        .then(data => {
            fs.writeFile(__dirname + `/output/detail.json`, data, 'utf8', () => {
                console.log('write [detail.json] success!');
            });
        });
};

export const fetch = () => {
    fs.readFile(__dirname + '/output/data.json', 'utf8', (err, data) => {
        if (err) throw err;
        const list = JSON.parse(data);
        fetchData(list);
    });
};

// 生成excel
export const postFetch = () => {
    fs.readFile(__dirname + '/output/detail.json', 'utf8', (err, content) => {
        if (err) throw err;
        const list = JSON.parse(content).list;
        const data = [];
        data.push(`
        <table>
        <thead>
            <tr>
            <th>id</th>
            <th>name</th>
            <th>keyword</th>
            <th>example</th>
            </tr>
        </thead>`);
        data.push('<tbody>');
        list.forEach(item => {
            item.list.forEach(subItem => {
                data.push(`
                   <tr>
                        <td>${item.id}</td>
                        <td>${item.name}</td>
                        <td>${subItem.keyword}</td>
                        <td>${subItem.example}</td>
                    </tr>
                `);
            })
        });
        data.push('</tbody></table>');
        const html = data.join('\n');
        fs.writeFile(__dirname + '/output/data.xls', html, 'utf8', () => {
            console.log('write [data.xls] success!');
        });
    });
};
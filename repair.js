const fs = require('fs');

fs.readFile(__dirname + '/dirty_data.json', 'utf8', (err, data) => {
    if (err) {
    	throw err
    };
    const dataList = JSON.parse(data);
    const list = dataList.list;
    const newList = list.map((item, index) => {
    	if(index > 0) {
    		item.list = list[index + 1] ? list[index + 1].list : [];
    	}
	   	return item; 	
    });
    newList.pop();
    dataList.list = newList;
    const dataListStr = JSON.stringify(dataList);
    fs.writeFile(__dirname + '/data_' + (+ new Date) + '.json', dataListStr, 'utf8', () => {
        console.log('write [data.json] success!');
    });
});

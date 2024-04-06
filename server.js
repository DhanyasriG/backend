const http = require('http');
const fs = require('fs');
const url = require('url');

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const { pathname, query } = parsedUrl;

    // Log request info
    console.log(`Request: ${req.method} ${pathname}`);

    // Set default response headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method === 'GET' && pathname === '/getFiles') {
        // Return list of uploaded files
        fs.readdir(__dirname, (err, files) => {
            if (err) {
                res.statusCode = 500;
                return res.end(JSON.stringify({ error: 'Internal Server Error' }));
            }
            res.end(JSON.stringify(files.filter(file => isValidFileType(file))));
        });
    } else if (req.method === 'GET' && pathname === '/getFile' && query.filename) {
        // Return file content
        const filename = query.filename;
        fs.readFile(filename, (err, data) => {
            if (err) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: 'File not found' }));
            }
            res.end(data);
        });
    } else if (req.method === 'POST' && pathname === '/createFile') {
        // Save file with given filename and content
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { filename, content } = JSON.parse(body);
                fs.writeFile(filename, content, err => {
                    if (err) {
                        res.statusCode = 500;
                        return res.end(JSON.stringify({ error: 'Internal Server Error' }));
                    }
                    res.end(JSON.stringify({ message: 'File created successfully' }));
                });
            } catch (error) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
            }
        });
    } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Not Found' }));
    }
});

const PORT = 8081;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

function isValidFileType(filename) {
    const validExtensions = ['.log', '.txt', '.json', '.yaml', '.xml', '.js'];
    const ext = filename.split('.').pop();
    return validExtensions.includes(`.${ext}`);
}

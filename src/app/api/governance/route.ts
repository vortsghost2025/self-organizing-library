import { NextResponse } from 'next/server';

export default async function handler(req: Request, res: Response) {
    const { method } = req;
    switch (method) {
        case 'GET':
            return NextResponse.json({ status: 200, message: 'Success' });
        default:
            return NextResponse.json({ status: 405, message: 'Method Not Allowed' });
    }
}
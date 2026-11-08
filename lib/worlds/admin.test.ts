import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
const mock = vi.hoisted(() => ({ auth: vi.fn(), from: vi.fn() }))
vi.mock('@/lib/session', () => ({ requireAdmin: mock.auth }))
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: {from: mock.from} }))
import { GET, POST, PUT, DELETE } from '@/app/api/admin/worlds/route'
const input = () => ({slug:'example',name:'Example',bio:'Lore',member_vtuber_ids:[],world_details:{sources:['https://example.com'],membership_sources:{},cast:[]}})
const req = (body: unknown, method='POST') => new NextRequest('https://example.com/api/admin/worlds', {method, body: JSON.stringify(body)})
beforeEach(() => { vi.resetAllMocks(); mock.auth.mockResolvedValue({username:'admin'}) })
describe('world admin boundary', () => {
  it.each([401,403])('blocks writes for unauthorized sessions (%i)', async status => {
    mock.auth.mockResolvedValue(NextResponse.json({error:'denied'}, {status}))
    for (const handler of [GET,POST,PUT,DELETE]) expect((await handler(req(input()))).status).toBe(status)
    expect(mock.from).not.toHaveBeenCalled()
  })
  it('only removes world rows, never ordinary groups or dossiers', async () => {
    const chain:any={};for(const key of ['delete','eq','select'])chain[key]=vi.fn(()=>chain);chain.maybeSingle=vi.fn().mockResolvedValue({data:{slug:'example'},error:null});mock.from.mockReturnValue(chain)
    expect((await DELETE(new NextRequest('https://example.com/api/admin/worlds?slug=example',{method:'DELETE'}))).status).toBe(200)
    expect(mock.from).toHaveBeenCalledTimes(1);expect(mock.from).toHaveBeenCalledWith('corpo_groups');expect(chain.eq).toHaveBeenCalledWith('kind','world')
  })
  it('rejects malformed JSON', async () => { const r=await POST(new NextRequest('https://example.com/api/admin/worlds',{method:'POST',body:'{'}));expect(r.status).toBe(400);expect(mock.from).not.toHaveBeenCalled() })
  it('rejects claims or kind injected into requests', async () => {expect((await POST(req({...input(),kind:'corpo'}))).status).toBe(400);expect(mock.from).not.toHaveBeenCalled()})
  it('blocks missing evidence', async () => { const w=input();w.world_details.sources=[];expect((await POST(req(w))).status).toBe(400);expect(mock.from).not.toHaveBeenCalled() })
  it('stores only a world and records editor rather than claiming creator authorship', async () => {
    const single=vi.fn().mockResolvedValue({data:{slug:'example'},error:null});const select=vi.fn(()=>({single}));const insert=vi.fn(()=>({select}));mock.from.mockReturnValue({insert})
    expect((await POST(req(input()))).status).toBe(200)
    expect(insert).toHaveBeenCalledWith({...input(),kind:'world',created_by:'admin'})
  })
  it('cannot edit an ordinary corpo through world management', async () => {
    const chain:any={};for(const key of ['update','eq','select'])chain[key]=vi.fn(()=>chain);chain.maybeSingle=vi.fn().mockResolvedValue({data:null,error:null});mock.from.mockReturnValue(chain)
    expect((await PUT(req(input(),'PUT'))).status).toBe(404)
    expect(chain.eq).toHaveBeenCalledWith('kind','world')
  })
  it('rejects nonexistent or unapproved dossiers', async () => {
    const chain:any={};for(const key of ['select','in'])chain[key]=vi.fn(()=>chain);chain.eq=vi.fn().mockResolvedValue({data:[],error:null});mock.from.mockReturnValue(chain)
    const w={...input(),member_vtuber_ids:['not-approved'],world_details:{...input().world_details,membership_sources:{'not-approved':['https://example.com']}}}
    expect((await POST(req(w))).status).toBe(400)
    expect(chain.eq).toHaveBeenCalledWith('approved',true)
  })
})

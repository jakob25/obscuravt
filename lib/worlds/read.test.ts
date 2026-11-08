import { beforeEach, describe, expect, it, vi } from 'vitest'
const mock=vi.hoisted(()=>({from:vi.fn()}))
vi.mock('@/lib/supabase',()=>({supabase:{from:mock.from}}))
import {readWorlds} from './read'
function query(result:unknown){ const chain:any={};for(const key of ['select','eq','order','contains'])chain[key]=vi.fn(()=>chain);chain.abortSignal=vi.fn().mockResolvedValue(result);mock.from.mockReturnValue(chain);return chain }
beforeEach(()=>vi.resetAllMocks())
describe('public world reads',()=>{
 it('degrades gracefully when the migration or service is unavailable', async()=>{query({data:null,error:{message:'no kind column'}});expect(await readWorlds('one')).toEqual({worlds:[],unavailable:true})})
 it('supports all world memberships for a dossier including one-member worlds',async()=>{
  const rows=['first','second'].map(slug=>({slug,name:slug,bio:'',member_vtuber_ids:['one'],world_details:{sources:['https://example.com'],membership_sources:{one:['https://example.com']},cast:[]}}))
  const chain=query({data:rows,error:null});expect((await readWorlds('one')).worlds).toHaveLength(2);expect(chain.contains).toHaveBeenCalledWith('member_vtuber_ids',['one']);expect(chain.eq).toHaveBeenCalledWith('kind','world')
 })
 it('isolates worlds by slug without loading the whole collection',async()=>{const chain=query({data:[],error:null});await readWorlds(undefined,'first');expect(chain.eq).toHaveBeenCalledWith('slug','first')})
 it('catches transport failures',async()=>{mock.from.mockImplementation(()=>{throw Error('offline')});expect((await readWorlds('one')).unavailable).toBe(true)})
})

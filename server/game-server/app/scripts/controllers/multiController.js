
class multiController
{

    constructor(redisHelper)
    {
        this.pkgcmd = []
        this.saveCount = 0
        this.redisHelper = redisHelper
    }

    push(...cmds)
    {
        this.pkgcmd.push(cmds);
    }

    get()
    {
        return this.pkgcmd
    }

    reset()
    {
        this.pkgcmd = []
    }

    debug_save(callback) {
        if(this.pkgcmd[0][1].split(':')[0] === 'inspThemData'){
            let temp = JSON.parse(JSON.stringify(this.pkgcmd[0]))
            let first = JSON.parse(this.pkgcmd[1][2])
            let exp = first.exp
            let userlevel = first.userlevel
            let last = JSON.parse(this.pkgcmd[this.pkgcmd.length-1][2])
            last.exp = exp
            last.userlevel = userlevel
            let last_base = JSON.parse(JSON.stringify(this.pkgcmd[this.pkgcmd.length-1]))
            last_base[2] = JSON.stringify(last)
            this.pkgcmd = [temp,last_base]
            this.save(function (err,data) {
                callback(err,data)
            })
        }else{
            let first = JSON.parse(this.pkgcmd[0][2])
            let exp = first.exp
            let userlevel = first.userlevel
            let last = JSON.parse(this.pkgcmd[this.pkgcmd.length-1][2])
            last.exp = exp
            last.userlevel = userlevel
            let last_base = JSON.parse(JSON.stringify(this.pkgcmd[this.pkgcmd.length-1]))
            last_base[2] = JSON.stringify(last)
            this.pkgcmd = [last_base]
            this.save(function (err,data) {
                callback(err,data)
            })
        }
    }

    async savesync()
    {
        let self = this
        return new Promise(resolve => {
            if(self.pkgcmd.length > 0){
                require('../../../db/redisAccess').multi(self.pkgcmd,function(err,data){
                    ++self.saveCount
                    console.log(self.saveCount + 'do this.packcmd : result',self.pkgcmd,err,data)
                    self.reset()
                    resolve(err)
                })
            }else{
                resolve(null)
            }
        })
    }

    uniqPush(...cmds){
        this.pkgcmd.map(element =>{
           if(element[1] === cmds[1] && element[0] === element[0]){
               let index = this.pkgcmd.indexOf(element)
               this.pkgcmd.splice(index,1)
           }
        })
        this.pkgcmd.push(cmds)
    }

    save(callback){
        let self = this
        if(this.pkgcmd.length > 0){
            require('../../../db/redisAccess').multi(self.pkgcmd,function(err,data){
                ++self.saveCount
                console.log(self.saveCount + 'do this.packcmd : result',self.pkgcmd,err,data)
                self.reset()
                callback(err,data)
            })
        }else{
            callback(null,1)
        }
    }
}

module.exports = multiController;

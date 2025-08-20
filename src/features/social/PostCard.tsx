import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, Animated } from 'react-native';
import { GlassSurface } from '../../ui/GlassSurface';
import { useStore } from '../../state/rootStore';
import { Post } from '../../state/slices/socialSlice';

export const PostCard: React.FC<{ post: Post; which:'circle'|'follow'}> = ({ post, which })=>{
  const react = useStore(s=>s.react);
  const scale = React.useRef(new Animated.Value(1)).current;
  const pulse = () => Animated.sequence([Animated.timing(scale,{toValue:0.96,duration:80,useNativeDriver:true}), Animated.spring(scale,{toValue:1,useNativeDriver:true})]).start();
  // style by type
  const borderTint = post.type==='checkin' ? (post.goalColor || 'rgba(16,185,129,0.5)') 
                    : post.type==='photo' ? 'rgba(255,255,255,0.35)'
                    : post.type==='audio' ? 'rgba(160,170,255,0.45)'
                    : 'rgba(255,255,255,0.12)';
  return (
    <GlassSurface style={[styles.card, { borderColor: borderTint }]}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={{fontSize:16}}>{post.avatar ?? '👤'}</Text>
        </View>
        <View style={{flex:1}}>
          <Pressable><Text style={styles.user}>{post.user}</Text></Pressable>
          <Text style={styles.when}>{post.time}</Text>
        </View>
        {post.type==='checkin' && !!post.goal && (
          <View style={[styles.goalChip, { borderColor: (post.goalColor || '#10B981')+'55' }]}>
            <Text style={[styles.goalChipText, { color: post.goalColor || '#10B981' }]}>{post.goal}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      {post.type==='checkin' && (
        <View style={styles.block}>
          <Text style={styles.checkTitle}>✅ {post.actionTitle}</Text>
          {!!post.streak && <Text style={styles.meta}>🔥 {post.streak} day streak</Text>}
        </View>
      )}
      {!!post.content && <Text style={styles.content}>{post.content}</Text>}
      {!!post.photoUri && <Image source={{uri: post.photoUri}} style={styles.photo} />}
      {post.type==='audio' && post.audioUri && (
        <View style={styles.audioRow}>
          <Text style={styles.audioBadge}>🎙️ Voice note</Text>
        </View>
      )}

      <Animated.View style={[styles.row,{transform:[{scale}]}]}>
        {['👏','💪','🔥'].map(e=>(
          <Pressable key={e} onPress={()=>{ pulse(); react(post.id,e,which); }} style={styles.pill}>
            <Text style={styles.pillText}>{e} {(post.reactions[e]||0)}</Text>
          </Pressable>
        ))}
        <Pressable style={[styles.pill, {marginLeft:'auto'}]}>
          <Text style={styles.pillText}>💬 Comment</Text>
        </Pressable>
      </Animated.View>
    </GlassSurface>
  );
};
const styles=StyleSheet.create({
  card:{ padding:16, marginBottom:12, borderWidth:1, borderRadius:16 },
  header:{ flexDirection:'row', alignItems:'center', marginBottom:8, gap:10 },
  avatar:{ width:36, height:36, borderRadius:18, backgroundColor:'rgba(255,255,255,0.08)', alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'rgba(255,255,255,0.14)' },
  user:{ color:'#FFF', fontWeight:'700' },
  when:{ color:'rgba(255,255,255,0.6)', fontSize:12 },
  goalChip:{ borderWidth:1, borderRadius:999, paddingVertical:6, paddingHorizontal:10 },
  goalChipText:{ fontWeight:'700' },
  block:{ borderWidth:1, borderColor:'rgba(255,255,255,0.12)', backgroundColor:'rgba(255,255,255,0.04)', borderRadius:12, padding:10, marginBottom:8 },
  checkTitle:{ color:'#FFF', fontWeight:'700' },
  meta:{ color:'rgba(255,255,255,0.7)', marginTop:4 },
  content:{ color:'#ECEDEF', marginTop:6, marginBottom:8, lineHeight:20 },
  photo:{ width:'100%', height:220, borderRadius:12, marginTop:4 },
  audioRow:{ marginTop:6, marginBottom:6 },
  audioBadge:{ color:'#DADBE0' },
  row:{ flexDirection:'row', gap:8 },
  pill:{ borderColor:'rgba(255,255,255,0.12)', borderWidth:1, paddingVertical:8, paddingHorizontal:14, borderRadius:999, backgroundColor:'rgba(255,255,255,0.05)' },
  pillText:{ color:'#FFFFFF' }
});
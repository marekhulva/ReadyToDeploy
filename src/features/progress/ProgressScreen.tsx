import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useStore } from '../../state/rootStore';
import { GlassSurface } from '../../ui/GlassSurface';
import { ProgressRing } from '../../ui/ProgressRing';
import { cocaScore } from '../../core/logic/calculations';

export const ProgressScreen = () => {
  const goals = useStore(s=>s.goals);
  const actions = useStore(s=>s.actions);
  const checkins = actions.filter(a=>a.done).length;
  const topStreak = Math.max(0, ...actions.map(a=>a.streak));
  const goalsCompleted = 0;
  const consistency = actions.length ? (checkins/actions.length)*100 : 0;
  const score = cocaScore(checkins, topStreak, goalsCompleted, consistency);

  return (
    <ScrollView style={{ flex:1, backgroundColor:'#000' }} contentContainerStyle={{ padding:16, paddingBottom:120 }}>
      <GlassSurface style={{ padding:16, marginBottom:16 }}>
        <Text style={styles.head}>Coca Score</Text>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:8 }}>
          <Text style={styles.big}>{score}</Text>
          <ProgressRing progress={consistency} />
        </View>
        <Text style={styles.subtle}>Consistency & check-ins power your score.</Text>
      </GlassSurface>

      <Text style={styles.head}>Your Goals</Text>
      {goals.length===0 ? <Text style={styles.subtle}>Add a goal from setup (placeholder).</Text> :
        goals.map(g => <GoalRow key={g.id} title={g.title} status={g.status} consistency={g.consistency} />)}
    </ScrollView>
  );
};

const GoalRow: React.FC<{title:string; status:string; consistency:number}> = ({title,status,consistency}) => (
  <GlassSurface style={{ padding:16, marginTop:12 }}>
    <Text style={{ color:'#FFF', fontWeight:'700' }}>{title}</Text>
    <Text style={{ color:'rgba(255,255,255,0.6)', marginTop:4 }}>{status} • {Math.round(consistency)}%</Text>
  </GlassSurface>
);

const styles=StyleSheet.create({
  head:{ color:'#FFF', fontWeight:'800', fontSize:22, marginBottom:8 },
  big:{ color:'#FFF', fontWeight:'900', fontSize:32 },
  subtle:{ color:'rgba(255,255,255,0.6)', marginTop:8 },
});
// Marca de Granito PC · línea de ilustrador a partir de la profundidad (nodo Custom).
//
// Va en el mismo material M_PP_Pintura, después del Kuwahara: multiplica el color por
// lerp(1, ColorTinta, Borde). Necesita un nodo SceneTexture:SceneDepth en el grafo (igual que
// PostProcessInput0 en el Kuwahara).
//   Entradas: Strength (0.4 a 0.8), Threshold (en unidades de Unreal, unos 25 = 25 cm)
//   Output Type = CMOT Float 1
// Devuelve 0 donde no hay borde y hasta 1 en los contornos de los objetos.

float2 uv = GetDefaultSceneTextureUV(Parameters, 1);   // 1 = SceneDepth
float2 texel = View.BufferSizeAndInvSize.zw;

float d  = SceneTextureLookup(uv, 1, false).r;
float dl = SceneTextureLookup(uv + float2(-1, 0) * texel, 1, false).r;
float dr = SceneTextureLookup(uv + float2( 1, 0) * texel, 1, false).r;
float du = SceneTextureLookup(uv + float2( 0,-1) * texel, 1, false).r;
float dd = SceneTextureLookup(uv + float2( 0, 1) * texel, 1, false).r;

// Diferencia relativa a la distancia: los bordes lejanos no se vuelven más gruesos
float grad = abs(dl - d) + abs(dr - d) + abs(du - d) + abs(dd - d);
float rel = grad / max(d, 1.0) * 1000.0;
float edge = saturate((rel - Threshold * 0.04) * 0.5);
return edge * Strength;

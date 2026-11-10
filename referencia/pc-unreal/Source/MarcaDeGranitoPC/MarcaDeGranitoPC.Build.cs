using System.IO;
using UnrealBuildTool;

public class MarcaDeGranitoPC : ModuleRules
{
	public MarcaDeGranitoPC(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

		// El núcleo de reglas (Rules/) usa nlohmann::json, que necesita excepciones de C++.
		bEnableExceptions = true;

		PublicDependencyModuleNames.AddRange(new string[]
		{
			"Core", "CoreUObject", "Engine", "InputCore", "EnhancedInput", "UMG", "Slate", "SlateCore"
		});

		// Núcleo portable (namespace mdg) y bibliotecas de terceros de solo cabecera
		PublicIncludePaths.Add(Path.Combine(ModuleDirectory, "Rules"));
		PublicIncludePaths.Add(Path.Combine(ModuleDirectory, "ThirdParty"));
		PrivateIncludePaths.Add(ModuleDirectory);
		PublicDefinitions.Add("MDG_IN_UNREAL=1");
	}
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreItemRequest;
use App\Http\Requests\UpdateItemRequest;
use App\Http\Resources\ItemResource;
use App\Models\Item;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
         $items = Item::query()
             ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(15);


        return response()->json([
            'success' => true,
            'data' => ItemResource::collection($items),
            'meta' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'total' => $items->total(),
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreItemRequest $request): JsonResponse
    {
          $item = Item::create([
            ...$request->validated(),
            'user_id' => $request->user()?->id,
        ]);

        return response()->json([
            "success" => true,
            "message" => "Item Created Successfully.",
            "data" => new ItemResource($item),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Item $item): JsonResponse
    {
        $this->authorize("view", $item);

        return response()->json([
            'success' => true,
            'data' => new ItemResource($item),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Item $item)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateItemRequest $request, Item $item): JsonResponse
    {
       $this->authorize('update', $item);

        $item->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Item updated successfully.',
            'data' => new ItemResource($item),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Item $item): JsonResponse
    {
        $this->authorize('delete', $item);

        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Item deleted successfully.',
        ], 200);
    }
}
